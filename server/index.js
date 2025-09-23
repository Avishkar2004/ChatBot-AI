import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import morgan from "morgan";
const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(express.json());
const allowedOrigins = (
  process.env.CLIENT_ORIGINS?.split(",") || [
    "https://chat-bot-ai-v6fl.vercel.app",
    "http://localhost:3000",
  ]
).map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Connect to MongoDB
connectDB();

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Chatbot AI Server is running!" });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "Connected",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", promptRoutes);
app.use("/api/projects", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
