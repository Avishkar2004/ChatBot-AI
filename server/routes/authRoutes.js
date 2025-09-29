import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/authController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

// Validation rules (trim + normalize + constraints)
const emailRule = body("email")
  .trim()
  .normalizeEmail()
  .isEmail()
  .withMessage("Valid email is required");

const passwordRule = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");

const usernameRule = body("username")
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage("Username must be 3-20 characters")
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage("Username can only contain letters, numbers, and underscores");

router.post("/register", [usernameRule, emailRule, passwordRule], register);
router.post("/login", [emailRule, passwordRule], login);

export default router;


