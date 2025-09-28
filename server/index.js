import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import morgan from "morgan";
const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(express.json({ 
  limit: '10mb',
  strict: false
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Check against allowed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      console.log('CORS blocked origin:', origin);
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
      "Access-Control-Request-Headers"
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
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", promptRoutes);
app.use("/api/projects", chatRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ 
      message: 'Invalid JSON format',
      error: 'Please check your request body format'
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
