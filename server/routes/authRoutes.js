import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/authController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

// Validation rules
const emailRule = body("email").isEmail().withMessage("Valid email is required");
const passwordRule = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");
const usernameRule = body("username")
  .isLength({ min: 3 })
  .withMessage("Username must be at least 3 characters");

router.post("/register", [usernameRule, emailRule, passwordRule], register);
router.post("/login", [emailRule, passwordRule], login);

export default router;


