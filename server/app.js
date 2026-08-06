import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./config/db.js";
import redisClient from "./config/redis.js";
import cors from "cors";
import { apiCache } from "./middleware/apiCache.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cacheRoutes from "./routes/cacheRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import logger from "./lib/logger.js";
import {
  requestContext,
  httpLogger,
  errorHandler,
  installProcessHandlers,
} from "./middleware/observability.js";

const PORT = process.env.PORT || 8080;
const app = express();

installProcessHandlers();

// Observability first: everything downstream inherits the request ID.
app.set("trust proxy", true);
app.use(requestContext);
app.use(httpLogger);

// Middleware
app.use(
  express.json({
    limit: "10mb",
    strict: false,
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const allowedOrigins = (
  process.env.CLIENT_ORIGINS?.split(",") || [
    "https://chat-bot-ai-v6fl.vercel.app",
    "http://localhost:3000",
  ]
)
  .map((o) => o.trim())
  .filter(Boolean);

// Optional regex to allow dynamic preview/prod domains (ex: Vercel previews)
const allowedOriginRegexes = (
  process.env.CLIENT_ORIGIN_REGEXES?.split(",") || []
)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      console.warn("Invalid CLIENT_ORIGIN_REGEXES pattern:", pattern);
      return null;
    }
  })
  .filter(Boolean);

// Safe default: allow your Vercel project deploys even if CLIENT_ORIGINS is misconfigured
// (ex: https://chat-bot-ai-<hash>.vercel.app)
const vercelProjectOrigin = /^https:\/\/chat-bot-ai-[a-z0-9-]+\.vercel\.app$/i;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  // Allow localhost on any port for development
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;

  if (allowedOrigins.includes(origin)) return true;
  if (vercelProjectOrigin.test(origin)) return true;
  if (allowedOriginRegexes.some((re) => re.test(origin))) return true;

  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (isAllowedOrigin(origin)) return callback(null, true);
      logger.warn("cors_blocked_origin", { origin, allowed: allowedOrigins });
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  }),
);

// Ensure preflight requests always get handled early
// NOTE: Express/path-to-regexp versions can throw on "*" routes. Regex works reliably.
app.options(/.*/, cors());
app.use(express.urlencoded({ extended: true }));

// Initialize all connections before starting server
const initializeServer = async () => {
  try {
    logger.info("server_initializing", { env: process.env.NODE_ENV || "development" });

    await connectDB();
    logger.info("mongodb_connected");

    // Connect to Redis (optional — server still starts if this fails)
    const redisConnected = await redisClient.connect();

    if (redisConnected) {
      await redisClient.set("test:health", "ok", 10);
      const result = await redisClient.get("test:health");
      await redisClient.del("test:health");
      logger.info("redis_connected", { healthCheck: result === "ok" ? "pass" : "fail" });
    } else {
      logger.warn("redis_unavailable", {
        impact: "caching and hot-window chat history disabled",
      });
    }

    if (!process.env.ADMIN_EMAILS) {
      logger.warn("admin_emails_unset", {
        impact: "/api/cache admin routes and /api/metrics will reject everyone",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      logger.warn("mailer_unconfigured", {
        impact: "password reset links are written to this log instead of emailed",
        fix: "set RESEND_API_KEY and MAIL_FROM",
      });
    }

    app.listen(PORT, () => {
      logger.info("server_listening", {
        port: PORT,
        health: `http://localhost:${PORT}/health`,
        metrics: `http://localhost:${PORT}/api/metrics`,
      });
    });
  } catch (error) {
    logger.error("server_initialization_failed", {
      err: error,
      hints: [
        "Check MongoDB connection string",
        "Check Redis credentials (optional — server can run without Redis)",
        "Verify network connectivity and firewall settings",
      ],
    });
    process.exit(1);
  }
};

// Initialize everything (skipped under test so the app can be imported without
// opening MongoDB/Redis connections or binding a port).
if (process.env.NODE_ENV !== "test") {
  initializeServer();
}

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Chatbot AI Server is running!" });
});

// Health check route with caching
app.get("/health", apiCache({ ttl: 30 }), async (req, res) => {
  let redisStatus = "Disconnected";
  try {
    // Test Redis with a simple operation
    await redisClient.set("health:check", "ok", 5);
    const result = await redisClient.get("health:check");
    await redisClient.del("health:check");
    redisStatus = result === "ok" ? "Connected" : "Disconnected";
  } catch (error) {
    redisStatus = "Error";
  }

  // readyState 1 = connected. This used to be hardcoded to "Connected", so the
  // health check reported healthy while every request was failing on Mongo.
  const database =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

  res.status(database === "Connected" ? 200 : 503).json({
    status: database === "Connected" ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    database,
    redis: redisStatus,
    // Note: no requestId here — this response is cached for 30s, so the header
    // (set per request) is the correlation source of truth for /health.
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", promptRoutes);
app.use("/api/projects", chatRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/metrics", metricsRoutes);

// Structured error handler: logs with the request ID, counts the failure,
// and forwards to the optional error webhook.
app.use(errorHandler);

export default app;
