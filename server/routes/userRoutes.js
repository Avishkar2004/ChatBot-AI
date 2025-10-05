import { Router } from "express";
import { body } from "express-validator";
import { getCurrentUser, updateProfile, deleteAccount } from "../controllers/userController.js";
import requireAuth from "../middleware/auth.js";
import { apiCache, invalidateCache } from "../middleware/apiCache.js";

const router = Router();

// Validation rules for profile updates
const usernameUpdateRule = body("username")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Username must be at least 3 characters")
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage("Username can only contain letters, numbers, and underscores");

const emailUpdateRule = body("email")
  .optional()
  .isEmail()
  .withMessage("Valid email is required");

// All routes require authentication
router.use(requireAuth);

// Get current user profile with caching
router.get("/me", apiCache({ ttl: 300 }), getCurrentUser);

// Update user profile with cache invalidation
router.put("/me", 
  [usernameUpdateRule, emailUpdateRule], 
  invalidateCache(['user_profile']),
  updateProfile
);

// Delete user account with cache invalidation
router.delete("/me", 
  invalidateCache(['user_profile', 'user_projects']),
  deleteAccount
);

export default router;
