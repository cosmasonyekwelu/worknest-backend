import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { helmetOptions, compressionOptions } from "./src/lib/options.js";
import logger from "./src/config/logger.js";
import { gracefulShutdown, isDatabaseReady } from "./src/config/db.server.js";
import { validateEnv } from "./src/config/env.js";
import { apiLimiter } from "./src/middleware/rateLimit.js";
import { requestIdMiddleware } from "./src/middleware/requestId.js";
import {
  catchNotFound,
  globalErrorHandler,
} from "./src/middleware/errorHandler.js";

dotenv.config();
validateEnv();

// api routes
import userRoutes from "./src/routes/userRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import contactRoutes from "./src/routes/contactRoute.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import docsRoutes from "./src/routes/docsRoutes.js";

const app = express();
app.set("trust proxy", 1);

const allowOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: allowOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));
app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(helmet(helmetOptions));
app.use(compression(compressionOptions));
app.use(apiLimiter);

app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.status(200).json({
    status: "success",
    message: "Welcome to Worknest Backend API",
    environment: process.env.NODE_ENV,
    timestamp: req.requestTime,
    docs: {
      swaggerUi: `${baseUrl}/docs`,
      openApiJson: `${baseUrl}/openapi.json`,
    },
  });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: req.requestTime });
});

app.get("/health/ready", (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      status: "not_ready",
      database: "disconnected",
      timestamp: req.requestTime,
    });
  }

  return res.status(200).json({
    status: "ready",
    database: "connected",
    timestamp: req.requestTime,
  });
});

// assemble routes
app.use(docsRoutes);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use(catchNotFound);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
      logger.info(`API base URL: http://localhost:${PORT}`);
      logger.info(`Swagger UI: http://localhost:${PORT}/docs`);
      logger.info(`OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
    });

    process.on("unhandledRejection", (reason) => {
      const error =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : String(reason);

      logger.error("Unhandled rejection. Shutting down.", { error });

      gracefulShutdown(server).finally(() => process.exit(1));
    });

    process.on("SIGTERM", () => gracefulShutdown(server));
    process.on("SIGINT", () => gracefulShutdown(server));

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
    logger.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

startServer();
