import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import Project from "../models/Project.js";
import Prompt from "../models/Prompt.js";
import Groq from "groq-sdk";
import "dotenv/config";

// This is a stub that echoes back messages.
// Hook in OpenAI/OpenRouter later and stream via SSE.

const router = Router();

router.use(requireAuth);

router.post(
  "/:projectId/chat",
  [param("projectId").isMongoId(), body("message").isLength({ min: 1 })],
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

    // Compose system prompt from project prompts
    const prompts = await Prompt.find({ projectId: project._id }).sort({
      createdAt: 1,
    });
    const systemText = prompts.length
      ? `You are the agent for project "${project.name}". Use these instructions:\n\n` +
        prompts.map((p, i) => `${i + 1}. ${p.title}: ${p.content}`).join("\n")
      : `You are a helpful assistant for the project "${project.name}".`;

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
        if (mm === "llama3-8b-8192" || mm === "llama3-70b-8192") return FALLBACK_MODEL; // deprecated
        if (mm.includes("llama3.1") || mm.includes("llama-3.1")) return FALLBACK_MODEL;
        if (mm.includes("mistral") || mm.includes("mixtral")) return "mixtral-8x7b-32768";
        return m; // assume caller passed a valid Groq model
      };
      let model = normalizeModel(requestedModel);

      let completion;
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemText },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
        });
      } catch (inner) {
        const msg = inner?.response?.data || inner?.message || "";
        const isDecommissioned = typeof msg === "string" ? msg.includes("model_decommissioned") || msg.includes("decommissioned") : false;
        if (isDecommissioned && model !== FALLBACK_MODEL) {
          // Retry once with fallback
          model = FALLBACK_MODEL;
          completion = await groq.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemText },
              { role: "user", content: userMessage },
            ],
            temperature: 0.3,
          });
        } else {
          throw inner;
        }
      }

      const reply = completion.choices?.[0]?.message?.content?.trim() || "";
      return res.json({ reply, model });
    } catch (e) {
      console.error("Groq chat error:", e?.response?.data || e.message || e);
      return res
        .status(500)
        .json({ message: "Groq request failed", error: e.message });
    }
  }
);

export default router;
