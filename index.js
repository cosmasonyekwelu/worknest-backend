import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import { helmetOptions, compressionOptions } from "./src/lib/options.js";
import logger from "./src/config/logger.js";

import { connectDB, gracefulShutdown } from "./src/config/db.server.js";

import userRoutes from "./src/routes/userRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import jobRoutes from "./src/routes/JobRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import authRoutes from "./src/routes/auth.js";

import {
  catchNotFound,
  globalErrorHandler,
} from "./src/middleware/errorHandler.js";

import googlePassportMiddleware from "./src/middleware/googleAuthMiddleware.js";

// ================================
// ✅ LOAD ENV
// ================================
dotenv.config();

// initialize google passport strategy AFTER env loads
googlePassportMiddleware();

const app = express();
app.set("trust proxy", 1);

// ================================
// ✅ CORS CONFIG
// ================================
const allowOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: allowOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ================================
// ✅ DEV LOGGER
// ================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ================================
// ✅ CORE MIDDLEWARES
// ================================
app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.disable("x-powered-by");

// ================================
// ✅ SECURITY + PERFORMANCE
// ================================
app.use(helmet(helmetOptions));
app.use(compression(compressionOptions));

// ================================
// ✅ SESSION + PASSPORT
// ================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// ================================
// ✅ REQUEST TIME MIDDLEWARE
// ================================
app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});

// ================================
// ✅ ROOT ROUTE
// ================================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Worknest Backend API",
    environment: process.env.NODE_ENV,
    timestamp: res.requestTime,
  });
});

// ================================
// ✅ API ROUTES
// ================================
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/auth", authRoutes);

// ================================
// ✅ ERROR HANDLING (MUST BE LAST)
// ================================
app.use(catchNotFound);
app.use(globalErrorHandler);

// ================================
// ✅ SERVER START
// ================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `\n✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
      logger.info(`🌐 http://localhost:${PORT}\n`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      logger.error("❌ UNHANDLED REJECTION:", reason);

      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    server.on("error", (error) => {
      if (error.code === "EACCES") {
        logger.error(`❌ Port ${PORT} requires elevated privileges`);
        process.exit(1);
      }
      if (error.code === "EADDRINUSE") {
        logger.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw error;
    });
  } catch (error) {
    logger.error(
      `❌ Failed to start server: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    process.exit(1);
  }
};

startServer();
