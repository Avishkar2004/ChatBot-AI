import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import requireAuth from "../middleware/auth.js";
import { chatRateLimit } from "../middleware/redisAuth.js";
import redisCache from "../services/redisCache.js";
import conversationStore from "../services/conversationStore.js";
import Project from "../models/Project.js";
import Prompt from "../models/Prompt.js";
import metrics from "../services/metrics.js";
import logger from "../lib/logger.js";
import { captureException } from "../middleware/observability.js";
import Groq from "groq-sdk";
import "dotenv/config";

const router = Router();

router.use(requireAuth);

const FALLBACK_MODEL = "llama-3.1-8b-instant";

/**
 * How much of the thread is replayed to the model each turn.
 *
 * This used to be a hard `slice(-10)` — five exchanges — which is why the
 * assistant appeared to forget the start of any real conversation. The window
 * is bounded twice: by message count and by characters, so a few very long
 * messages cannot silently blow past the model's context or the per-minute
 * token budget.
 */
const CONTEXT_MESSAGES = Number(process.env.CHAT_CONTEXT_MESSAGES || 40);
const CONTEXT_CHARS = Number(process.env.CHAT_CONTEXT_CHARS || 24000);

export const selectContext = (
  history,
  maxMessages = CONTEXT_MESSAGES,
  maxChars = CONTEXT_CHARS,
) => {
  const selected = [];
  let chars = 0;

  // Walk backwards from the most recent turn so the newest context always wins.
  for (let i = history.length - 1; i >= 0 && selected.length < maxMessages; i--) {
    const message = history[i];
    const cost = (message?.content || "").length;
    if (chars + cost > maxChars && selected.length > 0) break;
    selected.push(message);
    chars += cost;
  }

  return selected.reverse();
};

export const normalizeModel = (m) => {
  if (!m) return FALLBACK_MODEL;
  const mm = m.toLowerCase().trim();
  // Map non-Groq or deprecated names to current Groq defaults
  if (mm.startsWith("gpt")) return FALLBACK_MODEL;
  if (mm.includes("gpt-4o")) return FALLBACK_MODEL;
  if (mm === "llama3-8b-8192" || mm === "llama3-70b-8192")
    return FALLBACK_MODEL; // deprecated
  if (mm.includes("llama3.1") || mm.includes("llama-3.1"))
    return FALLBACK_MODEL;
  if (mm.includes("mistral") || mm.includes("mixtral"))
    return "mixtral-8x7b-32768";
  return m; // assume caller passed a valid Groq model
};

export const isDecommissionedError = (err) => {
  const msg = err?.response?.data || err?.message || "";
  return typeof msg === "string"
    ? msg.includes("model_decommissioned") || msg.includes("decommissioned")
    : false;
};

/**
 * The validator chains were previously declared and never read, so a malformed
 * projectId reached Mongoose and surfaced as a 500 instead of a clear 400.
 */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  const [first] = errors.array();
  res.status(400).json({ message: first.msg, errors: errors.array() });
  return true;
};

const findProject = (req) =>
  Project.findOne({ _id: req.params.projectId, userId: req.user.id });

// Record token spend + latency for one model call, and log a cost line so a
// single request can be traced from access log → tokens → dollars.
const recordCompletion = ({ model, usage = {}, startedAt, streamed = false }) => {
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const durationMs = Date.now() - startedAt;

  const costUsd = metrics.recordLlm({
    model,
    promptTokens,
    completionTokens,
    durationMs,
    streamed,
  });

  logger.info("llm_completion", {
    model,
    streamed,
    promptTokens,
    completionTokens,
    costUsd: Number(costUsd.toFixed(6)),
    durationMs,
  });
};

// Build the shared chat request context (project, thread, prompts, messages).
// Returns { error } with an HTTP status when something is wrong, otherwise the
// pieces needed to call Groq.
const buildChatContext = async (req) => {
  const project = await findProject(req);
  if (!project) return { error: { status: 404, message: "Project not found" } };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return {
      error: {
        status: 503,
        message: "The assistant is not configured yet. Please try again later.",
      },
    };

  const userId = req.user.id;
  const conversation = await conversationStore.resolveConversation({
    userId,
    projectId: project._id,
    conversationId: req.body.conversationId,
  });
  if (!conversation)
    return { error: { status: 404, message: "Conversation not found" } };

  // "Edit this message" and "regenerate" both replay from a known point: drop
  // that message and everything after it before assembling context.
  if (req.body.retryFromMessageId) {
    await conversationStore.truncateFrom(
      conversation,
      req.body.retryFromMessageId,
    );
  }

  // Get cached prompts or fetch from database
  let prompts = await redisCache.getCachedPrompts(project._id);
  if (!prompts) {
    prompts = await Prompt.find({ projectId: project._id }).sort({
      createdAt: 1,
    });
    await redisCache.cachePrompts(project._id, prompts);
  }

  const systemText = prompts.length
    ? `You are the agent for project "${project.name}". Use these instructions:\n\n` +
      prompts.map((p, i) => `${i + 1}. ${p.title}: ${p.content}`).join("\n")
    : `You are a helpful assistant for the project "${project.name}".`;

  // Read-through history: Redis hot window, with MongoDB fallback on a miss.
  const chatHistory = await conversationStore.loadContext(
    conversation,
    CONTEXT_MESSAGES,
  );

  const messages = [
    { role: "system", content: systemText },
    ...selectContext(chatHistory),
    { role: "user", content: req.body.message },
  ];

  return {
    groq: new Groq({ apiKey }),
    model: normalizeModel(project.model || process.env.GROQ_MODEL),
    messages,
    userMessage: req.body.message,
    conversation,
    userId,
    projectId: project._id,
  };
};

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

router.get(
  "/:projectId/conversations",
  [param("projectId").isMongoId().withMessage("Invalid project id")],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const conversations = await conversationStore.listConversations({
        userId: req.user.id,
        projectId: project._id,
      });
      return res.json({ conversations });
    } catch (e) {
      return next(e);
    }
  },
);

router.post(
  "/:projectId/conversations",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    body("title").optional().isString().trim().isLength({ max: 60 }),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const conversation = await conversationStore.createConversation({
        userId: req.user.id,
        projectId: project._id,
        title: req.body.title,
      });

      return res.status(201).json({
        conversation: {
          id: String(conversation._id),
          title: conversation.title,
          lastMessageAt: conversation.lastMessageAt,
          messageCount: 0,
        },
      });
    } catch (e) {
      return next(e);
    }
  },
);

router.patch(
  "/:projectId/conversations/:conversationId",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    param("conversationId").isMongoId().withMessage("Invalid conversation id"),
    body("title").isString().trim().isLength({ min: 1, max: 60 }),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const conversation = await conversationStore.renameConversation({
        userId: req.user.id,
        projectId: project._id,
        conversationId: req.params.conversationId,
        title: req.body.title,
      });
      if (!conversation)
        return res.status(404).json({ message: "Conversation not found" });

      return res.json({
        conversation: {
          id: String(conversation._id),
          title: conversation.title,
          lastMessageAt: conversation.lastMessageAt,
        },
      });
    } catch (e) {
      return next(e);
    }
  },
);

router.delete(
  "/:projectId/conversations/:conversationId",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    param("conversationId").isMongoId().withMessage("Invalid conversation id"),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const deleted = await conversationStore.deleteConversation({
        userId: req.user.id,
        projectId: project._id,
        conversationId: req.params.conversationId,
      });
      if (!deleted)
        return res.status(404).json({ message: "Conversation not found" });

      return res.json({ message: "Conversation deleted" });
    } catch (e) {
      return next(e);
    }
  },
);

router.get(
  "/:projectId/conversations/search",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    query("q").isString().trim().isLength({ min: 2, max: 200 }),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const results = await conversationStore.searchMessages({
        userId: req.user.id,
        projectId: project._id,
        query: req.query.q,
      });
      return res.json({ results });
    } catch (e) {
      return next(e);
    }
  },
);

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

router.get(
  "/:projectId/chat/history",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    query("conversationId")
      .optional()
      .isMongoId()
      .withMessage("Invalid conversation id"),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const conversation = await conversationStore.resolveConversation({
        userId: req.user.id,
        projectId: project._id,
        conversationId: req.query.conversationId,
      });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await conversationStore.loadMessages(conversation);

      return res.json({
        messages,
        conversationId: String(conversation._id),
        title: conversation.title,
        // Kept for older clients that echo this back on the next turn.
        sessionId: conversation.sessionId,
      });
    } catch (e) {
      return next(e);
    }
  },
);

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

const chatValidators = [
  param("projectId").isMongoId().withMessage("Invalid project id"),
  body("message")
    .isString()
    .trim()
    .isLength({ min: 1, max: 32000 })
    .withMessage("Message cannot be empty"),
  body("conversationId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid conversation id"),
  body("retryFromMessageId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid message id"),
];

router.post(
  "/:projectId/chat",
  chatValidators,
  chatRateLimit(60 * 1000, 20),
  async (req, res, next) => {
    if (validate(req, res)) return;

    let ctx;
    try {
      ctx = await buildChatContext(req);
    } catch (e) {
      return next(e);
    }
    if (ctx.error)
      return res.status(ctx.error.status).json({ message: ctx.error.message });

    const { groq, messages, userMessage, conversation, userId, projectId } = ctx;
    let { model } = ctx;
    const startedAt = Date.now();

    try {
      let completion;
      try {
        completion = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.3,
        });
      } catch (inner) {
        if (isDecommissionedError(inner) && model !== FALLBACK_MODEL) {
          // Retry once with fallback
          model = FALLBACK_MODEL;
          completion = await groq.chat.completions.create({
            model,
            messages,
            temperature: 0.3,
          });
        } else {
          throw inner;
        }
      }

      const reply = completion.choices?.[0]?.message?.content?.trim() || "";

      const saved = await conversationStore.persistExchange(
        { conversation, userId, projectId, model },
        userMessage,
        reply,
        completion.usage,
      );

      recordCompletion({ model, usage: completion.usage, startedAt });

      return res.json({
        reply,
        model,
        conversationId: String(conversation._id),
        sessionId: conversation.sessionId,
        ...saved,
      });
    } catch (e) {
      metrics.recordLlm({ model, failed: true, durationMs: Date.now() - startedAt });
      captureException(e, {
        message: "groq_chat_failed",
        route: "/api/projects/:projectId/chat",
        model,
        detail: e?.response?.data,
      });
      return res.status(502).json({
        message: "The assistant is unavailable right now. Please try again.",
        requestId: req.id,
      });
    }
  },
);

// Streaming chat endpoint (Server-Sent Events).
// Streams tokens as they are generated so the UI can render incrementally.
router.post(
  "/:projectId/chat/stream",
  chatValidators,
  chatRateLimit(60 * 1000, 20),
  async (req, res, next) => {
    if (validate(req, res)) return;

    let ctx;
    try {
      ctx = await buildChatContext(req);
    } catch (e) {
      return next(e);
    }
    if (ctx.error)
      return res.status(ctx.error.status).json({ message: ctx.error.message });

    const { groq, messages, userMessage, conversation, userId, projectId } = ctx;
    let { model } = ctx;

    // SSE headers. Disable proxy buffering so deltas flush immediately.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

    // A closed tab must stop the generation loop, not keep burning tokens
    // writing into a dead socket.
    let clientGone = false;
    req.on("close", () => {
      clientGone = true;
    });

    const openStream = async (m) =>
      groq.chat.completions.create({
        model: m,
        messages,
        temperature: 0.3,
        stream: true,
        // Ask Groq to emit a final usage chunk so we can record token spend.
        stream_options: { include_usage: true },
      });

    let full = "";
    let usage;
    const startedAt = Date.now();
    try {
      let stream;
      try {
        stream = await openStream(model);
      } catch (inner) {
        if (isDecommissionedError(inner) && model !== FALLBACK_MODEL) {
          model = FALLBACK_MODEL;
          stream = await openStream(model);
        } else {
          throw inner;
        }
      }

      // Tell the client which model/thread is in use before tokens arrive.
      send({
        meta: {
          model,
          conversationId: String(conversation._id),
          sessionId: conversation.sessionId,
        },
      });

      for await (const chunk of stream) {
        // The terminal usage chunk carries no choices.
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          full += delta;
          send({ delta });
        }
        if (clientGone) {
          // Stop pulling from Groq; whatever arrived is still worth saving.
          stream.controller?.abort?.();
          break;
        }
      }

      const reply = full.trim();
      // A stopped or abandoned stream still produced text the user saw, so it
      // is persisted rather than silently thrown away.
      if (reply) {
        const saved = await conversationStore.persistExchange(
          { conversation, userId, projectId, model },
          userMessage,
          reply,
          usage,
        );
        if (!clientGone) send({ saved });
      }

      recordCompletion({ model, usage, startedAt, streamed: true });

      if (!clientGone) {
        send({ done: true });
        res.write("data: [DONE]\n\n");
      }
      res.end();
    } catch (e) {
      metrics.recordLlm({
        model,
        streamed: true,
        failed: true,
        durationMs: Date.now() - startedAt,
      });
      captureException(e, {
        message: "groq_stream_failed",
        route: "/api/projects/:projectId/chat/stream",
        model,
        detail: e?.response?.data,
      });
      // Headers are already flushed, so surface the error as an SSE event
      // rather than an HTTP status.
      send({
        error: "The assistant is unavailable right now. Please try again.",
        requestId: req.id,
      });
      res.end();
    }
  },
);

// Clear the messages in one thread, keeping the thread itself.
router.delete(
  "/:projectId/chat/clear",
  [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    query("conversationId")
      .optional()
      .isMongoId()
      .withMessage("Invalid conversation id"),
  ],
  async (req, res, next) => {
    if (validate(req, res)) return;
    try {
      const project = await findProject(req);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const conversation = await conversationStore.resolveConversation({
        userId: req.user.id,
        projectId: project._id,
        conversationId: req.query.conversationId,
      });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      await conversationStore.clearMessages(conversation);

      return res.json({
        message: "Chat history cleared successfully",
        conversationId: String(conversation._id),
      });
    } catch (e) {
      return next(e);
    }
  },
);

export default router;
