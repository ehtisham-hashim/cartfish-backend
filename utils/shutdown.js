import mongoose from "mongoose";
import logger from "../config/logger.js";

let isShuttingDown = false;

export const flushLogsAndExit = (exitCode = 1) => {
  // Hard failsafe: force exit after 3s if a log transport hangs (.unref() won't block clean exit!)
  setTimeout(() => process.exit(exitCode), 3000).unref();
  logger.on("finish", () => process.exit(exitCode));
  logger.end();
};

export const registerProcessHandlers = (getServer) => {
  const shutdown = async (signal, exitCode = 0, err = null) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (err) {
      logger.error(`Fatal ${signal}: ${err.message || err}`, {
        stack: err.stack,
      });
    } else {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
    }

    // Hard failsafe timer (5 seconds max for draining HTTP + closing DB)
    setTimeout(() => {
      console.error("Graceful shutdown timed out. Forcing exit.");
      process.exit(exitCode || 1);
    }, 5000).unref();

    try {
      const server = getServer?.();
      if (server) {
        await new Promise((resolve) => server.close(resolve));
        logger.info("HTTP server closed (all in-flight requests finished).");
      }
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed cleanly.");
      }
    } catch (closeErr) {
      logger.error("Error during shutdown cleanup", { stack: closeErr.stack });
    } finally {
      flushLogsAndExit(exitCode);
    }
  };

  process.on("uncaughtException", (err) =>
    shutdown("uncaughtException", 1, err),
  );
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    shutdown("unhandledRejection", 1, err);
  });
  process.on("SIGTERM", () => shutdown("SIGTERM", 0));
  process.on("SIGINT", () => shutdown("SIGINT", 0));
};
