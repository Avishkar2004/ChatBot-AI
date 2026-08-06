import jwt from "jsonwebtoken";
import { addContext } from "../lib/logger.js";
import { JWT_SECRET } from "../config/secrets.js";
import tokenRegistry from "../services/tokenRegistry.js";

/**
 * Verify the bearer token's signature and shape. Deliberately synchronous: it
 * does no I/O, so it can never be the thing that makes a request hang.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    };
    // Kept for the revocation check and for /api/auth/logout.
    req.token = token;
    req.tokenIssuedAt = payload.iat;
    req.tokenExpiresAt = payload.exp;
    // Tag every subsequent log line in this request with the caller.
    addContext({ userId: req.user.id });
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Reject tokens that are still cryptographically valid but no longer should be:
 * explicitly signed out, or issued before the account's password changed.
 *
 * Fails open when Redis is unavailable — an outage in an optional cache should
 * degrade revocation, not lock every user out.
 */
export const requireActiveSession = async (req, res, next) => {
  try {
    if (await tokenRegistry.isRevoked(req.token)) {
      return res
        .status(401)
        .json({ message: "Session ended. Please log in again." });
    }

    const cutoff = await tokenRegistry.cutoffFor(req.user?.id);
    if (cutoff && req.tokenIssuedAt && req.tokenIssuedAt < cutoff) {
      return res.status(401).json({
        message: "Password changed. Please log in again.",
      });
    }

    return next();
  } catch (err) {
    return next();
  }
};

/**
 * The default export is the full check, so `router.use(requireAuth)` at every
 * existing call site picks up revocation without any further edits.
 */
export default [requireAuth, requireActiveSession];
