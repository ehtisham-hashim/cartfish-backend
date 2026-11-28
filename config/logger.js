import fs from "fs";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const isProd = process.env.NODE_ENV === "production";
fs.mkdirSync("logs", { recursive: true });

// Structured JSON format for files & production stdout
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Human-friendly colorized format for local development terminal
const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(
    ({ timestamp, level, message, requestId, stack, ...meta }) => {
      const reqTag = requestId ? ` [${requestId.slice(0, 8)}]` : "";
      const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `${timestamp} ${level}${reqTag}: ${stack || message}${extra}`;
    },
  ),
);

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  defaultMeta: { service: "cartfish-backend" },
  format: jsonFormat,
  transports: [
    // 1. Terminal / Docker stdout
    new winston.transports.Console({
      level: isProd ? "info" : "debug",
      format: isProd ? jsonFormat : devConsoleFormat,
    }),

    // 2. Rotating Error-Only Log File (auto-compresses & prunes after 14 days)
    new DailyRotateFile({
      dirname: "logs",
      filename: "errors-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),

    // 3. Rotating Combined Log File (http, info, warn, error)
    new DailyRotateFile({
      dirname: "logs",
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "http",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
    }),
  ],
});

// Stream adapter so Morgan HTTP logs flow directly into Winston's "http" level
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
