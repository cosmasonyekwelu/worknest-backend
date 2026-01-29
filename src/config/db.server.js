import mongoose from "mongoose";
import logger from "./logger.js";

const dbConnection = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 5,
};

export const connectDB = async () => {
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

      mongoose.connection.on("error", (err) => {
        logger.error("❌ MongoDB connection error:", err);
        dbConnection.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("⚠️ MongoDB disconnected");
        dbConnection.isConnected = false;

        if (dbConnection.retryCount < dbConnection.maxRetries) {
          dbConnection.retryCount++;
          logger.info(
            `🔁 Reconnecting (${dbConnection.retryCount}/${dbConnection.maxRetries})...`,
          );
          setTimeout(connectDB, 5000);
        }
      });
    }
  } catch (error) {
    dbConnection.retryCount++;
    logger.error(
      `❌ MongoDB connection failed (${dbConnection.retryCount}/${dbConnection.maxRetries})`,
      error instanceof Error ? error.message : error,
    );

    if (dbConnection.retryCount < dbConnection.maxRetries) {
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

/* -------------------- GRACEFUL SHUTDOWN -------------------- */
export const gracefulShutdown = async () => {
  try {
    logger.info("🛑 Gracefully shutting down...");

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info("✅ MongoDB connection closed");
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

/* -------------------- UNCAUGHT EXCEPTIONS -------------------- */
process.on("uncaughtException", async (error) => {
  logger.error("❌ UNCAUGHT EXCEPTION:", error);
  await gracefulShutdown();
});
