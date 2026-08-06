import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import tokenRegistry from "../services/tokenRegistry.js";
import { sendMail } from "../lib/mailer.js";
import logger from "../lib/logger.js";
import { JWT_SECRET, JWT_EXPIRES_IN, APP_URL } from "../config/secrets.js";

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MINUTES = 60;
const isProduction = process.env.NODE_ENV === "production";

// Compared against when no user matches, so a login attempt costs the same
// whether or not the address exists. Computed once at boot.
const TIMING_EQUALIZER_HASH = bcrypt.hashSync(
  "no-such-account-timing-equalizer",
  BCRYPT_ROUNDS,
);

const signToken = (user) =>
  jwt.sign(
    { sub: user._id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
});

const rejectInvalid = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  const [first] = errors.array();
  // Surface one human-readable line as `message`; the form shows that directly
  // instead of falling back to "Request failed with status code 400".
  res.status(400).json({ message: first.msg, errors: errors.array() });
  return true;
};

// Mongo's duplicate-key error names the offending index, which is the only
// reliable way to tell "email taken" from "username taken" when two writers
// race past the pre-check.
const duplicateFieldFrom = (err) => {
  if (err?.code !== 11000) return null;
  const key = Object.keys(err.keyPattern || err.keyValue || {})[0];
  return key || "field";
};

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const register = async (req, res) => {
  if (rejectInvalid(req, res)) return;

  const { password } = req.body;
  // The schema stores both lowercased; compare on the same footing so the
  // pre-check does not miss "Alice" colliding with an existing "alice".
  const email = req.body.email.toLowerCase();
  const username = req.body.username.toLowerCase();

  try {
    // `findOne({ email, username })` matched only when BOTH collided, so
    // reusing an email with a new username slipped through and blew up on the
    // unique index as an opaque 500. Check either field independently.
    const existing = await User.findOne({ $or: [{ email }, { username }] })
      .select("email username")
      .lean();

    if (existing) {
      return res.status(409).json({
        message:
          existing.email === email
            ? "That email is already registered. Try logging in instead."
            : "That username is taken. Please pick another.",
        field: existing.email === email ? "email" : "username",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ username, email, passwordHash });

    return res.status(201).json({
      user: publicUser(user),
      token: signToken(user),
    });
  } catch (err) {
    const field = duplicateFieldFrom(err);
    if (field) {
      return res.status(409).json({
        message:
          field === "email"
            ? "That email is already registered. Try logging in instead."
            : "That username is taken. Please pick another.",
        field,
      });
    }

    logger.error("register_failed", { err });
    return res.status(500).json({
      message: "Registration failed. Please try again.",
      requestId: req.id,
    });
  }
};

export const login = async (req, res) => {
  if (rejectInvalid(req, res)) return;

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    // Compare against a dummy hash when the user is missing so both branches
    // cost the same and the response time does not reveal which emails exist.
    const isMatch = await bcrypt.compare(
      password,
      user ? user.passwordHash : TIMING_EQUALIZER_HASH,
    );

    if (!user || !isMatch) {
      return res
        .status(401)
        .json({ message: "Incorrect email or password." });
    }

    return res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    logger.error("login_failed", { err });
    return res
      .status(500)
      .json({ message: "Login failed. Please try again.", requestId: req.id });
  }
};

/**
 * End the current session for real: park this token until its own expiry so a
 * copy of it stops working the moment the user signs out.
 */
export const logout = async (req, res) => {
  try {
    await tokenRegistry.revoke(req.token, req.tokenExpiresAt);
    return res.json({ message: "Signed out" });
  } catch (err) {
    logger.warn("logout_revoke_failed", { err });
    // The client clears its own storage regardless; never block sign-out.
    return res.json({ message: "Signed out" });
  }
};

/**
 * Start a password reset. Always answers with the same message whether or not
 * the address exists, so this endpoint cannot be used to enumerate accounts.
 */
export const forgotPassword = async (req, res) => {
  if (rejectInvalid(req, res)) return;

  const genericResponse = {
    message:
      "If an account exists for that email, a reset link is on its way.",
  };

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("base64url");
    user.resetTokenHash = hashResetToken(rawToken);
    user.resetTokenExpiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );
    await user.save();

    const link = `${APP_URL}/reset-password?token=${rawToken}`;
    const delivery = await sendMail({
      to: user.email,
      subject: "Reset your password",
      text:
        `Hi ${user.username},\n\n` +
        `Use this link to choose a new password. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.\n\n` +
        `${link}\n\n` +
        `If you didn't ask for this, you can ignore this email — your password stays the same.\n`,
    });

    // With no mail provider the link is otherwise only reachable by copying a
    // 43-character token out of a log line by hand — which is exactly how you
    // end up submitting a truncated token and getting "invalid or expired".
    // Outside production, hand it back so the UI can offer it as a real link.
    if (!delivery.delivered && !isProduction) {
      logger.warn("password_reset_link", { email: user.email, resetUrl: link });
      return res.json({ ...genericResponse, resetUrl: link });
    }

    return res.json(genericResponse);
  } catch (err) {
    logger.error("forgot_password_failed", { err });
    // Still generic: an error here must not confirm the address either.
    return res.json(genericResponse);
  }
};

/** Finish a reset using the emailed token. */
export const resetPassword = async (req, res) => {
  if (rejectInvalid(req, res)) return;

  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "That reset link is invalid or has expired. Request a new one.",
      });
    }

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    user.passwordChangedAt = new Date();
    await user.save();

    // Anyone holding an older token — including whoever prompted the reset —
    // is signed out everywhere.
    await tokenRegistry.revokeAllForUser(user._id.toString());

    return res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    logger.error("reset_password_failed", { err });
    return res.status(500).json({
      message: "Could not reset your password. Please try again.",
      requestId: req.id,
    });
  }
};

/** Change the password while signed in; requires the current one. */
export const changePassword = async (req, res) => {
  if (rejectInvalid(req, res)) return;

  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Your current password is incorrect.", field: "currentPassword" });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({
        message: "Your new password must be different from the current one.",
        field: "newPassword",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    await tokenRegistry.revokeAllForUser(user._id.toString());

    // Hand back a fresh token so the device that made the change stays signed
    // in while every other session is dropped.
    return res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    logger.error("change_password_failed", { err });
    return res.status(500).json({
      message: "Could not change your password. Please try again.",
      requestId: req.id,
    });
  }
};
