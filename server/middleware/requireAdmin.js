import logger from "../lib/logger.js";

/**
 * Admin gate for operational endpoints (cache flush, metrics).
 *
 * Membership comes from ADMIN_EMAILS (comma-separated). The default is deny:
 * with the variable unset nobody is an admin, so a fresh deploy never exposes
 * destructive operations by accident.
 */

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdmin = (user) => {
  const allowed = adminEmails();
  if (!allowed.length) return false;
  return Boolean(user?.email && allowed.includes(user.email.toLowerCase()));
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  if (!isAdmin(req.user)) {
    logger.warn("admin_access_denied", {
      userId: req.user.id,
      path: req.originalUrl?.split("?")[0],
      configured: adminEmails().length > 0,
    });
    return res.status(403).json({
      message: adminEmails().length
        ? "Admin privileges required"
        : "Admin access is not configured (set ADMIN_EMAILS)",
    });
  }

  return next();
};

export default requireAdmin;
