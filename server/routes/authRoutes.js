import { Router } from "express";
import { body } from "express-validator";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/authController.js";
import requireAuth from "../middleware/auth.js";
import { rateLimit } from "../middleware/redisAuth.js";

const router = Router();

// Validation rules (trim + normalize + constraints)
const emailRule = body("email")
  .trim()
  .normalizeEmail()
  .isEmail()
  .withMessage("Valid email is required");

const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters");

// Existing accounts were created under a 6-character minimum, so logging in
// must not start rejecting them. Only new/changed passwords get the stronger
// rule above.
const loginPasswordRule = body("password")
  .isLength({ min: 1 })
  .withMessage("Password is required");

const usernameRule = body("username")
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage("Username must be 3-20 characters")
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage("Username can only contain letters, numbers, and underscores");

const resetTokenRule = body("token")
  .isString()
  .trim()
  .isLength({ min: 20, max: 200 })
  .withMessage("Reset token is missing or malformed");

// Credential endpoints are the ones worth brute-forcing, so they get their own
// per-IP budget on top of anything a proxy applies.
const credentialLimit = rateLimit(15 * 60 * 1000, 20);
const resetLimit = rateLimit(60 * 60 * 1000, 5);

router.post(
  "/register",
  credentialLimit,
  [usernameRule, emailRule, passwordRule],
  register,
);
router.post("/login", credentialLimit, [emailRule, loginPasswordRule], login);

router.post("/forgot-password", resetLimit, [emailRule], forgotPassword);
router.post(
  "/reset-password",
  resetLimit,
  [resetTokenRule, passwordRule],
  resetPassword,
);

router.post("/logout", requireAuth, logout);
router.post(
  "/change-password",
  requireAuth,
  [
    body("currentPassword").isLength({ min: 1 }).withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  changePassword,
);

export default router;
