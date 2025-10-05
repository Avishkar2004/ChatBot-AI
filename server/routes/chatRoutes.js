import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import { chatRateLimit } from "../middleware/redisAuth.js";
import redisCache from "../services/redisCache.js";
import Project from "../models/Project.js";
import Prompt from "../models/Prompt.js";
import Groq from "groq-sdk";
import "dotenv/config";

const router = Router();

router.use(requireAuth);

router.post(
  "/:projectId/chat",
  [param("projectId").isMongoId(), body("message").isLength({ min: 1 })],
  chatRateLimit(60 * 1000, 10), // 10 requests per minute
  async (req, res) => {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res.status(500).json({ message: "GROQ_API_KEY not configured" });

    const groq = new Groq({ apiKey });
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

    // Get chat history from Redis
    const chatHistory = await redisCache.getCachedChatSession(sessionId);

    try {
      // Prefer explicit Groq-supported defaults; allow overrides via env or project.model
      const requestedModel = project.model || process.env.GROQ_MODEL;
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
      let model = normalizeModel(requestedModel);

      // Build messages array with chat history
      const messages = [
        { role: "system", content: systemText },
        ...chatHistory.slice(-10), // Keep last 10 messages for context
        { role: "user", content: userMessage },
      ];

      let completion;
      try {
        completion = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.3,
        });
      } catch (inner) {
        const msg = inner?.response?.data || inner?.message || "";
        const isDecommissioned =
          typeof msg === "string"
            ? msg.includes("model_decommissioned") ||
              msg.includes("decommissioned")
            : false;
        if (isDecommissioned && model !== FALLBACK_MODEL) {
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

      // Store conversation in Redis
      await redisCache.addMessageToSession(sessionId, {
        role: "user",
        content: userMessage,
      });
      await redisCache.addMessageToSession(sessionId, {
        role: "assistant",
        content: reply,
      });

      return res.json({ reply, model, sessionId });
    } catch (e) {
      console.error("Groq chat error:", e?.response?.data || e.message || e);
      return res
        .status(500)
        .json({ message: "Groq request failed", error: e.message });
    }
  }
);

export default router;
