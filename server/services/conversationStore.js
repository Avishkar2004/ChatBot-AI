import crypto from "node:crypto";
import redisCache from "./redisCache.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const MAX_TITLE_LEN = 60;
const DEFAULT_TITLE = "New conversation";

// Derive a readable conversation title from the first user message.
const makeTitle = (text) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_TITLE;
  return clean.length > MAX_TITLE_LEN
    ? `${clean.slice(0, MAX_TITLE_LEN - 1)}…`
    : clean;
};

// Every thread gets its own session key so its Redis hot window is independent.
const newSessionId = (userId, projectId) =>
  `${userId}_${projectId}_${crypto.randomBytes(6).toString("hex")}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Durable conversation storage.
 *
 * MongoDB is the system of record; Redis is a read-through cache of the most
 * recent messages used for fast context assembly. Writes go to Mongo first,
 * then mirror into the Redis hot window.
 *
 * A project can hold many threads. `sessionId` is the internal key that ties a
 * thread to its cache entry; the client works in terms of `conversationId`.
 */
class ConversationStore {
  // -------------------------------------------------------------------------
  // Thread lifecycle
  // -------------------------------------------------------------------------

  async listConversations({ userId, projectId }, limit = 100) {
    const conversations = await Conversation.find({ userId, projectId })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .lean();

    if (!conversations.length) return [];

    // One grouped count rather than a query per thread.
    const counts = await Message.aggregate([
      { $match: { conversationId: { $in: conversations.map((c) => c._id) } } },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const countBy = new Map(counts.map((c) => [String(c._id), c.count]));

    return conversations.map((c) => ({
      id: String(c._id),
      title: c.title || DEFAULT_TITLE,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
      messageCount: countBy.get(String(c._id)) || 0,
    }));
  }

  async createConversation({ userId, projectId, title }) {
    return Conversation.create({
      userId,
      projectId,
      sessionId: newSessionId(userId, projectId),
      title: title?.trim() || DEFAULT_TITLE,
      lastMessageAt: new Date(),
    });
  }

  async getConversation({ userId, projectId, conversationId }) {
    if (!conversationId) return null;
    return Conversation.findOne({ _id: conversationId, userId, projectId });
  }

  /**
   * Resolve the thread a request should act on.
   *
   * With an explicit id, that thread (or null if it is not the caller's). With
   * none, the most recently used one, creating a first thread when the project
   * has never been chatted with.
   */
  async resolveConversation({ userId, projectId, conversationId }) {
    if (conversationId) {
      return this.getConversation({ userId, projectId, conversationId });
    }

    const latest = await Conversation.findOne({ userId, projectId }).sort({
      lastMessageAt: -1,
    });
    if (latest) return latest;

    return this.createConversation({ userId, projectId });
  }

  async renameConversation({ userId, projectId, conversationId, title }) {
    return Conversation.findOneAndUpdate(
      { _id: conversationId, userId, projectId },
      { $set: { title: makeTitle(title) } },
      { new: true },
    );
  }

  async deleteConversation({ userId, projectId, conversationId }) {
    const convo = await Conversation.findOne({
      _id: conversationId,
      userId,
      projectId,
    });
    if (!convo) return false;

    await Message.deleteMany({ conversationId: convo._id });
    await Conversation.deleteOne({ _id: convo._id });
    await redisCache.clearChatSession(convo.sessionId);
    return true;
  }

  // -------------------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------------------

  /**
   * Full messages for display, straight from Mongo so each one carries the id
   * the UI needs to edit or regenerate from it.
   */
  async loadMessages(conversation, limit = 200) {
    if (!conversation) return [];
    const docs = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    docs.reverse();

    return docs.map((d) => ({
      id: String(d._id),
      role: d.role,
      content: d.content,
      model: d.model || undefined,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Trimmed role/content pairs for prompt assembly.
   * Tries the Redis hot window first; on a miss (e.g. TTL expiry) falls back to
   * MongoDB and rewarms the cache so subsequent turns are fast again.
   */
  async loadContext(conversation, limit = 50) {
    if (!conversation) return [];

    const cached = await redisCache.getCachedChatSession(
      conversation.sessionId,
      limit,
    );
    if (cached && cached.length) return cached;

    const docs = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    docs.reverse();

    const messages = docs.map((d) => ({ role: d.role, content: d.content }));
    if (messages.length) {
      // Rewarm Redis with the chronological window (cacheChatSession lpushes
      // each entry, so chronological in → chronological out via getCached...).
      await redisCache.cacheChatSession(conversation.sessionId, messages);
    }
    return messages;
  }

  /**
   * Drop `messageId` and everything after it.
   *
   * Backs "edit this message" and "regenerate": the tail is removed so the new
   * turn is generated from clean history rather than appended to a reply the
   * user has already rejected.
   *
   * Ordering is resolved over explicit ids because a user message and its reply
   * are inserted together and can share a millisecond, which makes a timestamp
   * comparison ambiguous.
   */
  async truncateFrom(conversation, messageId) {
    if (!conversation || !messageId) return 0;

    const ids = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean();

    const index = ids.findIndex((m) => String(m._id) === String(messageId));
    if (index === -1) return 0;

    const doomed = ids.slice(index).map((m) => m._id);
    await Message.deleteMany({ _id: { $in: doomed } });

    // The hot window no longer reflects Mongo; drop it and let the next read
    // rebuild it from the system of record.
    await redisCache.clearChatSession(conversation.sessionId);
    return doomed.length;
  }

  /**
   * Persist a completed user/assistant exchange durably (Mongo) and mirror it
   * into the Redis hot window.
   */
  async persistExchange(
    { conversation, userId, projectId, sessionId, model },
    userMessage,
    assistantReply,
    usage = {},
  ) {
    // Callers that already resolved the thread pass it in; the older
    // sessionId-only form still works.
    const convo =
      conversation ||
      (await this.getOrCreateConversation({ userId, projectId, sessionId }));

    const inserted = await Message.insertMany([
      {
        conversationId: convo._id,
        projectId,
        userId,
        role: "user",
        content: userMessage,
      },
      {
        conversationId: convo._id,
        projectId,
        userId,
        role: "assistant",
        content: assistantReply,
        model: model || "",
        tokens: {
          prompt: usage?.prompt_tokens || 0,
          completion: usage?.completion_tokens || 0,
        },
      },
    ]);

    const update = { lastMessageAt: new Date() };
    if (!convo.title || convo.title === DEFAULT_TITLE) {
      update.title = makeTitle(userMessage);
    }
    await Conversation.updateOne({ _id: convo._id }, { $set: update });

    const cacheKey = convo.sessionId || sessionId;
    // Best-effort cache mirror; Mongo already holds the durable copy.
    await redisCache.addMessageToSession(cacheKey, {
      role: "user",
      content: userMessage,
    });
    await redisCache.addMessageToSession(cacheKey, {
      role: "assistant",
      content: assistantReply,
    });

    return {
      conversationId: String(convo._id),
      title: update.title,
      userMessageId: inserted?.[0]?._id ? String(inserted[0]._id) : undefined,
      assistantMessageId: inserted?.[1]?._id
        ? String(inserted[1]._id)
        : undefined,
    };
  }

  /** Clear one thread's messages but keep the thread itself. */
  async clearMessages(conversation) {
    if (!conversation) return;
    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { title: DEFAULT_TITLE, lastMessageAt: new Date() } },
    );
    await redisCache.clearChatSession(conversation.sessionId);
  }

  /**
   * Substring search across every thread in a project.
   * Case-insensitive and literal — a user typing "how much $?" is searching for
   * that text, not writing a regular expression.
   */
  async searchMessages({ userId, projectId, query }, limit = 50) {
    const term = (query || "").trim();
    if (term.length < 2) return [];

    const matches = await Message.find({
      userId,
      projectId,
      content: { $regex: escapeRegex(term), $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!matches.length) return [];

    const conversations = await Conversation.find({
      _id: { $in: [...new Set(matches.map((m) => String(m.conversationId)))] },
      userId,
    })
      .select("title")
      .lean();
    const titleBy = new Map(
      conversations.map((c) => [String(c._id), c.title || DEFAULT_TITLE]),
    );

    return matches
      .filter((m) => titleBy.has(String(m.conversationId)))
      .map((m) => {
        const at = m.content.toLowerCase().indexOf(term.toLowerCase());
        const start = Math.max(0, at - 40);
        return {
          messageId: String(m._id),
          conversationId: String(m.conversationId),
          conversationTitle: titleBy.get(String(m.conversationId)),
          role: m.role,
          createdAt: m.createdAt,
          snippet:
            (start > 0 ? "…" : "") +
            m.content.slice(start, start + 160).trim() +
            (m.content.length > start + 160 ? "…" : ""),
        };
      });
  }

  // -------------------------------------------------------------------------
  // Legacy helpers, kept so older call sites and tests keep working
  // -------------------------------------------------------------------------

  async getOrCreateConversation({ userId, projectId, sessionId }) {
    let convo = await Conversation.findOne({ userId, projectId, sessionId });
    if (!convo) {
      convo = await Conversation.create({ userId, projectId, sessionId });
    }
    return convo;
  }

  async loadHistory({ userId, projectId, sessionId }, limit = 50) {
    const cached = await redisCache.getCachedChatSession(sessionId, limit);
    if (cached && cached.length) return cached;

    const convo = await Conversation.findOne({ userId, projectId, sessionId });
    if (!convo) return [];

    const docs = await Message.find({ conversationId: convo._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    docs.reverse();

    const messages = docs.map((d) => ({ role: d.role, content: d.content }));
    if (messages.length) {
      await redisCache.cacheChatSession(sessionId, messages);
    }
    return messages;
  }

  async clear({ userId, projectId, sessionId }) {
    const convo = await Conversation.findOne({ userId, projectId, sessionId });
    if (convo) {
      await Message.deleteMany({ conversationId: convo._id });
      await Conversation.deleteOne({ _id: convo._id });
    }
    await redisCache.clearChatSession(sessionId);
  }
}

export default new ConversationStore();
