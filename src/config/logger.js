import winston from "winston";
import path from "path";
import fs from "fs";

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file logging only in production
if (process.env.NODE_ENV === "development") {
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

const redactSensitive = winston.format((info) => {
  const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'newPassword', 'confirmPassword'];
  const redact = (obj) => {
    if (!obj || typeof obj !== 'object' || obj instanceof Error) return obj;
    Object.keys(obj).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        redact(obj[key]);
      }
    });
    return obj;
  };
  return redact(info);
});

const logger = winston.createLogger({
  defaultMeta: { service: "worknest-backend", instance: process.pid },
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    redactSensitive(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const store = asyncLocalStorage.getStore();
      const requestId = store?.get('requestId') || meta.requestId;
      let msg = `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}: ${message}`

      const cleanMeta = { ...meta };
      delete cleanMeta.requestId;

      if (Object.keys(cleanMeta).length) msg += " " + JSON.stringify(cleanMeta);
      return msg;
    })
  ),
  transports,
});

export { asyncLocalStorage };
export default logger;