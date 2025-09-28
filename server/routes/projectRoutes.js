import { Router } from "express";
import { body, param } from "express-validator";
import requireAuth from "../middleware/auth.js";
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
      
      res.status(201).json(project);
    } catch (e) {
      console.error('Create project error:', e);
      res.status(400).json({ message: e.message });
    }
  }
);

// List user's projects
router.get("/", async (req, res) => {
  const projects = await Project.find({ userId: req.user.id }).sort({
    updatedAt: -1,
  });
  res.json(projects);
});

// Get a project
router.get(
  "/:projectId",
  [param("projectId").isMongoId()],
  async (req, res) => {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  }
);

// Update a project
router.put(
  "/:projectId",
  [param("projectId").isMongoId()],
  async (req, res) => {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  }
);

// Delete a project
router.delete(
  "/:projectId",
  [param("projectId").isMongoId()],
  async (req, res) => {
    const result = await Project.deleteOne({
      _id: req.params.projectId,
      userId: req.user.id,
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Project not found" });
    res.json({ ok: true });
  }
);

export default router;
