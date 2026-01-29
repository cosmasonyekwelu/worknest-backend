import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { helmetOptions, compressionOptions } from "./src/lib/options.js";
import logger from "./src/config/logger.js";
import { connectDB, gracefulShutdown } from "./src/config/db.server.js";
import jobRoutes from "./src/routes/JobRoutes.js";
import { OAuth2Client } from "google-auth-library";
import {
  catchNotFound,
  globalErrorHandler,
} from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const allowOrigins = [process.env.CLIENT_URL];
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(
  cors({
    origin: allowOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

console.log("pp", process.env.MONGO_URI);

app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.disabled("x-powered-by");
app.use(helmet(helmetOptions));
app.use(compression(compressionOptions));

app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Worknest Backend API",
    environment: process.env.NODE_ENV,
    timestamp: req.requestTime,
  });
});

app.use("/api/jobs", jobRoutes);

//handle route errors
// app.use((req, res, next) => {
//   next(catchNotFound());
// });

// //global error handler
// app.use((req, res, next) => {
//   next(globalErrorHandler());
// });
app.use(catchNotFound);
app.use(globalErrorHandler);
const PORT = process.env.PORT || 5000;

// Start the server

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
