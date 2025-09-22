import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import Prompt from "../models/Prompt.js";
import Project from "../models/Project.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

// Ensure project belongs to user
async function assertProject(req, res, next) {
  const project = await Project.findOne({ _id: req.params.projectId, userId: req.user.id });
  if (!project) return res.status(404).json({ message: "Project not found" });
  req.project = project;
  next();
}

// List prompts
router.get("/:projectId/prompts", assertProject, async (req, res) => {
  const prompts = await Prompt.find({ projectId: req.project._id }).sort({ updatedAt: -1 });
  res.json(prompts);
});

// Create prompt
router.post(
  "/:projectId/prompts",
  assertProject,
  [body("title").isLength({ min: 1 }), body("content").isLength({ min: 1 })],
  async (req, res) => {
    try {
      const prompt = await Prompt.create({
        projectId: req.project._id,
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
      });
      res.status(201).json(prompt);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

// Update prompt
router.put(
  "/:projectId/prompts/:promptId",
  assertProject,
  [param("promptId").isMongoId()],
  async (req, res) => {
    const prompt = await Prompt.findOneAndUpdate(
      { _id: req.params.promptId, projectId: req.project._id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!prompt) return res.status(404).json({ message: "Prompt not found" });
    res.json(prompt);
  }
);

// Delete prompt
router.delete(
  "/:projectId/prompts/:promptId",
  assertProject,
  [param("promptId").isMongoId()],
  async (req, res) => {
    const result = await Prompt.deleteOne({ _id: req.params.promptId, projectId: req.project._id, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Prompt not found" });
    res.json({ ok: true });
  }
);

export default router;


