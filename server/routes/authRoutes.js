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

router.post("/register", [emailRule, passwordRule], register);
router.post("/login", [emailRule, passwordRule], login);

// Example protected route
router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export default router;


