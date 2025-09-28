import { Router } from "express";
import { body } from "express-validator";
import { getCurrentUser, updateProfile, deleteAccount } from "../controllers/userController.js";
import requireAuth from "../middleware/auth.js";

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

// Get current user profile
router.get("/me", getCurrentUser);

// Update user profile
router.put("/me", [usernameUpdateRule, emailUpdateRule], updateProfile);

// Delete user account
router.delete("/me", deleteAccount);

export default router;
