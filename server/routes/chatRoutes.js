import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import { chatRateLimit } from "../middleware/redisAuth.js";
import redisCache from "../services/redisCache.js";
import conversationStore from "../services/conversationStore.js";
import Project from "../models/Project.js";
import Prompt from "../models/Prompt.js";
import Groq from "groq-sdk";
import "dotenv/config";

const router = Router();

router.use(requireAuth);

const FALLBACK_MODEL = "llama-3.1-8b-instant";

const normalizeModel = (m) => {
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

const isDecommissionedError = (err) => {
  const msg = err?.response?.data || err?.message || "";
  return typeof msg === "string"
    ? msg.includes("model_decommissioned") || msg.includes("decommissioned")
    : false;
};

// Build the shared chat request context (project, prompts, messages, model).
// Returns { error } with an HTTP status when something is wrong, otherwise the
// pieces needed to call Groq.
const buildChatContext = async (req) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    userId: req.user.id,
  });
  if (!project) return { error: { status: 404, message: "Project not found" } };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return { error: { status: 500, message: "GROQ_API_KEY not configured" } };

  const userMessage = req.body.message;
  const sessionId =
    req.body.sessionId || `${req.user.id}_${req.params.projectId}`;

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
  const userId = req.user.id;
  const chatHistory = await conversationStore.loadHistory({
    userId,
    projectId: project._id,
    sessionId,
  });

  const messages = [
    { role: "system", content: systemText },
    ...chatHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: userMessage },
  ];

  return {
    groq: new Groq({ apiKey }),
    model: normalizeModel(project.model || process.env.GROQ_MODEL),
    messages,
    userMessage,
    sessionId,
    userId,
    projectId: project._id,
  };
};

// GET chat history endpoint
router.get(
  "/:projectId/chat/history",
  [param("projectId").isMongoId()],
  async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.projectId,
        userId: req.user.id,
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const sessionId = `${req.user.id}_${req.params.projectId}`;
      const chatHistory = await conversationStore.loadHistory(
        { userId: req.user.id, projectId: project._id, sessionId },
        100,
      );

      return res.json({ messages: chatHistory, sessionId });
    } catch (e) {
      console.error("Error fetching chat history:", e);
      return res
        .status(500)
        .json({ message: "Failed to fetch chat history", error: e.message });
    }
  },
);

router.post(
  "/:projectId/chat",
  [param("projectId").isMongoId(), body("message").isLength({ min: 1 })],
  chatRateLimit(60 * 1000, 10), // 10 requests per minute
  async (req, res) => {
    const ctx = await buildChatContext(req);
    if (ctx.error)
      return res.status(ctx.error.status).json({ message: ctx.error.message });

    const { groq, messages, userMessage, sessionId, userId, projectId } = ctx;
    let { model } = ctx;

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

      await conversationStore.persistExchange(
        { userId, projectId, sessionId, model },
        userMessage,
        reply,
        completion.usage,
      );

      return res.json({ reply, model, sessionId });
    } catch (e) {
      console.error("Groq chat error:", e?.response?.data || e.message || e);
      return res
        .status(500)
        .json({ message: "Groq request failed", error: e.message });
    }
  },
);

// Streaming chat endpoint (Server-Sent Events).
// Streams tokens as they are generated so the UI can render incrementally.
router.post(
  "/:projectId/chat/stream",
  [param("projectId").isMongoId(), body("message").isLength({ min: 1 })],
  chatRateLimit(60 * 1000, 10), // 10 requests per minute
  async (req, res) => {
    const ctx = await buildChatContext(req);
    if (ctx.error)
      return res.status(ctx.error.status).json({ message: ctx.error.message });

    const { groq, messages, userMessage, sessionId, userId, projectId } = ctx;
    let { model } = ctx;

    // SSE headers. Disable proxy buffering so deltas flush immediately.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

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

      // Tell the client which model/session is in use before tokens arrive.
      send({ meta: { model, sessionId } });

      for await (const chunk of stream) {
        // The terminal usage chunk carries no choices.
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          full += delta;
          send({ delta });
        }
      }

      const reply = full.trim();
      await conversationStore.persistExchange(
        { userId, projectId, sessionId, model },
        userMessage,
        reply,
        usage,
      );

      send({ done: true });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (e) {
      console.error("Groq stream error:", e?.response?.data || e.message || e);
      // If nothing has been sent yet we could still set a status, but headers
      // are already flushed — surface the error as an SSE event instead.
      send({ error: e.message || "Groq request failed" });
      res.end();
    }
  },
);

// DELETE chat history endpoint
router.delete(
  "/:projectId/chat/clear",
  [param("projectId").isMongoId()],
  async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.projectId,
        userId: req.user.id,
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const sessionId = `${req.user.id}_${req.params.projectId}`;
      await conversationStore.clear({
        userId: req.user.id,
        projectId: project._id,
        sessionId,
      });

      return res.json({ message: "Chat history cleared successfully" });
    } catch (e) {
      console.error("Error clearing chat history:", e);
      return res
        .status(500)
        .json({ message: "Failed to clear chat history", error: e.message });
    }
  },
);

export default router;
