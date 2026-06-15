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

/**
 * Durable conversation storage.
 *
 * MongoDB is the system of record; Redis is a read-through cache of the most
 * recent messages used for fast context assembly. Writes go to Mongo first,
 * then mirror into the Redis hot window.
 */
class ConversationStore {
  async getOrCreateConversation({ userId, projectId, sessionId }) {
    let convo = await Conversation.findOne({ userId, projectId, sessionId });
    if (!convo) {
      convo = await Conversation.create({ userId, projectId, sessionId });
    }
    return convo;
  }

  /**
   * Load recent history for context assembly.
   * Tries the Redis hot window first; on a miss (e.g. TTL expiry) falls back to
   * MongoDB and rewarms the cache so subsequent turns are fast again.
   */
  async loadHistory({ userId, projectId, sessionId }, limit = 50) {
    const cached = await redisCache.getCachedChatSession(sessionId, limit);
    if (cached && cached.length) return cached;

    const convo = await Conversation.findOne({ userId, projectId, sessionId });
    if (!convo) return [];

    // Fetch the most recent `limit` messages, then restore chronological order.
    const docs = await Message.find({ conversationId: convo._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    docs.reverse();

    const messages = docs.map((d) => ({ role: d.role, content: d.content }));
    if (messages.length) {
      // Rewarm Redis with the chronological window (cacheChatSession lpushes
      // each entry, so chronological in → chronological out via getCached...).
      await redisCache.cacheChatSession(sessionId, messages);
    }
    return messages;
  }

  /**
   * Persist a completed user/assistant exchange durably (Mongo) and mirror it
   * into the Redis hot window.
   */
  async persistExchange(
    { userId, projectId, sessionId, model },
    userMessage,
    assistantReply,
    usage = {}
  ) {
    const convo = await this.getOrCreateConversation({
      userId,
      projectId,
      sessionId,
    });

    await Message.insertMany([
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
          prompt: usage.prompt_tokens || 0,
          completion: usage.completion_tokens || 0,
        },
      },
    ]);

    const update = { lastMessageAt: new Date() };
    if (!convo.title || convo.title === DEFAULT_TITLE) {
      update.title = makeTitle(userMessage);
    }
    await Conversation.updateOne({ _id: convo._id }, { $set: update });

    // Best-effort cache mirror; Mongo already holds the durable copy.
    await redisCache.addMessageToSession(sessionId, {
      role: "user",
      content: userMessage,
    });
    await redisCache.addMessageToSession(sessionId, {
      role: "assistant",
      content: assistantReply,
    });
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
