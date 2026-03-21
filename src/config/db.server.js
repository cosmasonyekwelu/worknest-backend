import mongoose from "mongoose";
import logger from "./logger.js";

const dbConnection = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 5,
};

export const isDatabaseReady = () => mongoose.connection?.readyState === 1;

export const connectToDB = async () => {
  if (dbConnection.isConnected) {
    logger.info("✅ Using existing MongoDB connection");
    return;
  }

  if (dbConnection.retryCount >= dbConnection.maxRetries) {
    logger.error("❌ Max MongoDB connection retries reached");
    process.exit(1);
  }

  const connectionOptions = {
    dbName: process.env.DATABASE_NAME,
    serverSelectionTimeoutMS: 45000,
    socketTimeoutMS: 5000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 50,
    minPoolSize: 1,
    monitorCommands: process.env.NODE_ENV === "development",
  };
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      connectionOptions,
    );
    dbConnection.isConnected = conn.connections[0].readyState === 1;
    dbConnection.retryCount = 0;

    if (dbConnection.isConnected) {
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Connection event handlers
      mongoose.connection.on("error", (err) => {
        logger.error("❌ MongoDB connection error:", err);
        dbConnection.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        logger.info("ℹ️  MongoDB disconnected");
        dbConnection.isConnected = false;
        // Attempt to reconnect
        if (dbConnection.retryCount < dbConnection.maxRetries) {
          dbConnection.retryCount++;
          logger.info(
            `ℹ️  Attempting to reconnect (${dbConnection.retryCount}/${dbConnection.maxRetries})...`,
          );
          setTimeout(connectToDB, 5000);
        }
      });
    }
  } catch (error) {
    dbConnection.retryCount++;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      `❌ MongoDB connection failed (attempt ${dbConnection.retryCount}/${dbConnection.maxRetries}):`,
      errorMessage,
    );

    if (dbConnection.retryCount < dbConnection.maxRetries) {
      logger.info("ℹ️  Retrying in 5 seconds...");
      setTimeout(connectToDB, 5000);
    } else {
      logger.error("❌ Max retries reached. Exiting...");
      process.exit(1);
    }
  }
};

// Handle graceful shutdown
export const gracefulShutdown = async (server = null) => {
  try {
    logger.info("🛑 Received shutdown signal. Closing server...");

    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info("✅ HTTP server closed");
          resolve();
        });
      });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info("✅ MongoDB connection closed");
    }

    logger.info("✅ Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(error.name || "Error", error.message || "Unknown error");
  if (error.stack) {
    logger.error(error.stack);
  }
  gracefulShutdown().finally(() => process.exit(1));
});

connectToDB();
