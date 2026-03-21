import { AppError } from "../lib/errors.js";
import logger from "../config/logger.js";

const sendError = (err, res) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    status: err.status || "error",
    message: err.message || "Something went wrong",
  };

  if (err.errors) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

export const globalErrorHandler = (err, req, res, next) => {
  let normalizedError = err;

  if (!(normalizedError instanceof AppError)) {
    if (normalizedError.name === "JsonWebTokenError") {
      normalizedError = new AppError("Invalid token. Please log in again", 401);
    } else if (normalizedError.name === "TokenExpiredError") {
      normalizedError = new AppError("Your token has expired. Please login again", 401);
    } else if (normalizedError.name === "ValidationError") {
      normalizedError = new AppError(normalizedError.message, 400);
    } else if (normalizedError.name === "CastError") {
      normalizedError = new AppError("Invalid resource identifier", 400);
    } else if (normalizedError.code === 11000) {
      normalizedError = new AppError("Duplicate field value", 409);
    } else if (normalizedError.name === "MulterError") {
      normalizedError = new AppError(normalizedError.message, 400);
    } else {
      logger.error("Unexpected error", {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      });

      const statusCode = err.statusCode || 500;
      const message =
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : (err.message || "Something went wrong");

      normalizedError = new AppError(message, statusCode);
    }
  }

  const statusCode = normalizedError.statusCode || 500;
  const baseLogMeta = {
    message: normalizedError.message,
    name: normalizedError.name,
    method: req?.method,
    path: req?.originalUrl,
    statusCode,
    errors: normalizedError.errors,
  };

  if (statusCode >= 500) {
    logger.error("Request failed with server error", {
      ...baseLogMeta,
      stack: normalizedError.stack,
    });
  } else if (statusCode >= 400) {
    logger.warn("Request failed with client error", baseLogMeta);
  }

  return sendError(normalizedError, res);
};

export const catchNotFound = (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
};
