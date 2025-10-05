import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
import { redisAuth, rateLimit } from "../middleware/redisAuth.js";
import { apiCache, invalidateCache } from "../middleware/apiCache.js";
import redisCache from "../services/redisCache.js";
import Project from "../models/Project.js";

const router = Router();

router.use(requireAuth);

// Create project
router.post(
  "/",
  [body("name").isLength({ min: 1 }).withMessage("Name is required")],
  async (req, res) => {
    try {
      // Debug: Log the request body
      
      // Validate request body
      const { name, description = "", model, provider } = req.body;
      
      // Check if name is provided
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ 
          message: "Project name is required and must be a string" 
        });
      }
      
      const trimmedName = name.trim();
      
      // Check if name is not empty after trimming
      if (!trimmedName) {
        return res.status(400).json({ 
          message: "Project name cannot be empty" 
        });
      }
      
      // Check if project with same name already exists for this user
      const existingProject = await Project.findOne({ 
        userId: req.user.id, 
        name: trimmedName 
      });
      
      if (existingProject) {
        return res.status(409).json({ 
          message: "Project with this name already exists" 
        });
      }
      
      const project = await Project.create({
        userId: req.user.id,
        name: trimmedName,
        description: (description || "").trim(),
        model: model || "gpt-4o-mini",
        provider: provider || "openai",
      });
      
      // Invalidate user projects cache
      await redisCache.invalidateUserProjects(req.user.id);
      
      res.status(201).json(project);
    } catch (e) {
      console.error('Create project error:', e);
      res.status(400).json({ message: e.message });
    }
  }
);

// List user's projects with enhanced caching
router.get("/", 
  rateLimit(60 * 1000, 30),
  apiCache({ ttl: 1800 }), // 30 minutes
  async (req, res) => {
  try {
    // Try to get from cache first
    const cachedProjects = await redisCache.getCachedUserProjects(req.user.id);
    
    if (cachedProjects) {
      return res.json(cachedProjects);
    }
    
    // If not in cache, fetch from database
    const projects = await Project.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });
    
    // Cache the results
    await redisCache.cacheUserProjects(req.user.id, projects);
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get a project with caching
router.get(
  "/:projectId",
  [param("projectId").isMongoId()],
  apiCache({ ttl: 3600 }), // 1 hour
  async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      // Try to get from cache first
      const cachedProject = await redisCache.getCachedProject(projectId);
      
      if (cachedProject) {
        return res.json(cachedProject);
      }
      
      // If not in cache, fetch from database
      const project = await Project.findOne({
        _id: projectId,
        userId: req.user.id,
      });
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Cache the project
      await redisCache.cacheProject(projectId, project);
      
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  }
);

// Update a project with cache invalidation
router.put(
  "/:projectId",
  [param("projectId").isMongoId()],
  invalidateCache(['user_projects', 'project']),
  async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      const project = await Project.findOneAndUpdate(
        { _id: projectId, userId: req.user.id },
        { $set: req.body },
        { new: true }
      );
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Invalidate cache
      await redisCache.invalidateProject(projectId);
      await redisCache.invalidateUserProjects(req.user.id);
      
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  }
);

// Delete a project with cache invalidation
router.delete(
  "/:projectId",
  [param("projectId").isMongoId()],
  invalidateCache(['user_projects', 'project']),
  async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      const result = await Project.deleteOne({
        _id: projectId,
        userId: req.user.id,
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Invalidate cache
      await redisCache.invalidateProject(projectId);
      await redisCache.invalidateUserProjects(req.user.id);
      
      res.json({ ok: true });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: 'Failed to delete project' });
    }
  }
);

export default router;
