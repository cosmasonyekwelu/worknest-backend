import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { helmetOptions, compressionOptions } from "./src/lib/options.js";
import logger from "./src/config/logger.js";
import { gracefulShutdown } from "./src/config/db.server.js";
import { catchNotFound, globalErrorHandler } from "./src/middleware/errorHandler.js";

dotenv.config();

// api routes
import userRoutes from "./src/routes/userRoutes.js";
const app = express();
app.set("trust proxy", 1);

const allowOrigins = [process.env.CLIENT_URL];

app.use(
  cors({
    origin: allowOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
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

// assemble routes
app.use("/api/v1/auth", userRoutes)

//handle route errors
app.use((req, res, next) => {
  next(catchNotFound());
});


//global error handler
app.use((req, res, next) => {
next(globalErrorHandler());
});
const PORT = process.env.PORT || 5000;

// Start the server

const startServer = async () => {
  try {
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `\n✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      logger.info(`🌐 http://localhost:${PORT}\n`);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      console.error("\n❌ UNHANDLED REJECTION! Shutting down...");

      const error =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : String(reason);

      logger.error("Reason:", error);

      // Close server gracefully
      server.close(() => {
        logger.info("💥 Process terminated due to unhandled rejection");
        process.exit(1);
      });
    });

    // Handle termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    // Handle any other errors
    server.on("error", (error) => {
      if (error.syscall !== "listen") throw error;

      switch (error.code) {
        case "EACCES":
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`\n❌ Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

startServer();
