import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import { apiCache, invalidateCache } from "../middleware/apiCache.js";
import redisCache from "../services/redisCache.js";
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

// List prompts with caching
router.get("/:projectId/prompts", 
  assertProject, 
  apiCache({ ttl: 1800 }), // 30 minutes
  async (req, res) => {
    try {
      // Try to get from cache first
      const cachedPrompts = await redisCache.getCachedPrompts(req.project._id);
      
      if (cachedPrompts) {
        return res.json(cachedPrompts);
      }
      
      // If not in cache, fetch from database
      const prompts = await Prompt.find({ projectId: req.project._id }).sort({ updatedAt: -1 });
      
      // Cache the results
      await redisCache.cachePrompts(req.project._id, prompts);
      
      res.json(prompts);
    } catch (error) {
      console.error('Get prompts error:', error);
      res.status(500).json({ message: 'Failed to fetch prompts' });
    }
  }
);

// Create prompt with cache invalidation
router.post(
  "/:projectId/prompts",
  assertProject,
  [body("title").isLength({ min: 1 }), body("content").isLength({ min: 1 })],
  invalidateCache(['prompts']),
  async (req, res) => {
    try {
      const prompt = await Prompt.create({
        projectId: req.project._id,
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
      });
      
      // Invalidate cache
      await redisCache.invalidatePrompts(req.project._id);
      
      res.status(201).json(prompt);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

// Update prompt with cache invalidation
router.put(
  "/:projectId/prompts/:promptId",
  assertProject,
  [param("promptId").isMongoId()],
  invalidateCache(['prompts']),
  async (req, res) => {
    try {
      const prompt = await Prompt.findOneAndUpdate(
        { _id: req.params.promptId, projectId: req.project._id, userId: req.user.id },
        { $set: req.body },
        { new: true }
      );
      if (!prompt) return res.status(404).json({ message: "Prompt not found" });
      
      // Invalidate cache
      await redisCache.invalidatePrompts(req.project._id);
      
      res.json(prompt);
    } catch (error) {
      console.error('Update prompt error:', error);
      res.status(500).json({ message: 'Failed to update prompt' });
    }
  }
);

// Delete prompt with cache invalidation
router.delete(
  "/:projectId/prompts/:promptId",
  assertProject,
  [param("promptId").isMongoId()],
  invalidateCache(['prompts']),
  async (req, res) => {
    try {
      const result = await Prompt.deleteOne({ 
        _id: req.params.promptId, 
        projectId: req.project._id, 
        userId: req.user.id 
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      // Invalidate cache
      await redisCache.invalidatePrompts(req.project._id);
      
      res.json({ ok: true });
    } catch (error) {
      console.error('Delete prompt error:', error);
      res.status(500).json({ message: 'Failed to delete prompt' });
    }
  }
);

export default router;


