import { Router } from "express";
import requireAuth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import metrics from "../services/metrics.js";
import { getLogLevel, setLogLevel } from "../lib/logger.js";

const router = Router();

// Operational data — authenticated admins only.
router.use(requireAuth, requireAdmin);

/**
 * GET /api/metrics            → JSON snapshot
 * GET /api/metrics?format=prometheus → text exposition for a scraper
 */
router.get("/", (req, res) => {
  if (req.query.format === "prometheus") {
    res.set("Content-Type", "text/plain; version=0.0.4");
    return res.send(metrics.toPrometheus());
  }
  return res.json(metrics.snapshot());
});

// Flip verbosity without a redeploy while debugging an incident.
router.post("/log-level", (req, res) => {
  const { level } = req.body || {};
  if (!level) {
    return res.status(400).json({ message: "level is required" });
  }
  setLogLevel(level);
  return res.json({ level: getLogLevel() });
});

router.post("/reset", (req, res) => {
  metrics.reset();
  return res.json({ message: "Metrics reset", timestamp: new Date().toISOString() });
});

export default router;
