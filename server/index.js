import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import redisClient from "./config/redis.js";
import cors from "cors";
import {
  apiCache,
  cacheStats,
  invalidateCache,
} from "./middleware/apiCache.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cacheRoutes from "./routes/cacheRoutes.js";
import morgan from "morgan";
const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(
  express.json({
    limit: "10mb",
    strict: false,
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const allowedOrigins = (
  process.env.CLIENT_ORIGINS?.split(",") || [
    "https://chat-bot-ai-v6fl.vercel.app",
    "http://localhost:3000",
  ]
).map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost on any port for development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      // Check against allowed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("CORS blocked origin:", origin);
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
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// API Caching middleware
app.use(cacheStats);

// Initialize all connections before starting server
const initializeServer = async () => {
  try {
    console.log("Initializing Chatbot AI Server...\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB connected successfully\n");

    // Connect to Redis
    console.log("Connecting to Redis Cloud...");
    await redisClient.connect();
    console.log("Redis Cloud connected successfully\n");

    // Test Redis connection
    console.log("Testing Redis operations...");
    try {
      // Test basic Redis operations
      await redisClient.set("test:health", "ok", 10);
      const result = await redisClient.get("test:health");
      await redisClient.del("test:health");

      if (result === "ok") {
        console.log("Redis health check passed\n");
      } else {
        console.log("Redis health check failed, but continuing...\n");
      }
    } catch (error) {
      console.log("Redis health check failed:", error.message);
      console.log("   Continuing with limited functionality...\n");
    }

    // Start the server
    console.log("Starting HTTP server...");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Cache stats: http://localhost:${PORT}/api/cache/stats`);
      console.log("\nChatbot AI Server is ready!");
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    console.log("\nTroubleshooting:");
    console.log("   1. Check MongoDB connection string");
    console.log("   2. Check Redis Cloud credentials");
    console.log("   3. Verify network connectivity");
    console.log("   4. Check firewall settings");
    process.exit(1);
  }
};

// Initialize everything
initializeServer();

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

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "Connected",
    redis: redisStatus,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", promptRoutes);
app.use("/api/projects", chatRoutes);
app.use("/api/cache", cacheRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON format",
      error: "Please check your request body format",
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message,
  });
});
