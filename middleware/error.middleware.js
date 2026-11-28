import multer from "multer";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";

// 1. Catch-All 404 Middleware (place right AFTER all /api/v1/* routes)
export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// 2. Global Error Middleware (MUST keep all 4 params so fn.length === 4!)
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let isOperational = Boolean(err.isOperational);

  // Normalize third-party library errors into clean operational 4xx responses
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    isOperational = true;
    if (err.code === "LIMIT_FILE_SIZE")
      message = "File too large (max 2MB per image)";
    if (err.code === "LIMIT_UNEXPECTED_FILE")
      message = "Too many images or wrong field name";
  } else if (err.name === "CastError") {
    statusCode = 400;
    isOperational = true;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    isOperational = true;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    statusCode = 409;
    isOperational = true;
    const field = Object.keys(err.keyValue || {})[0] || "Resource";
    message = `${field} already exists`;
  } else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    isOperational = true;
    message = "Invalid or expired authentication token";
  }

  // Structured log metadata (NEVER log passwords or Authorization headers!)
  const logMeta = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?._id?.toString() || "anonymous",
  };

  if (statusCode >= 500) {
    logger.error(message, { ...logMeta, stack: err.stack });
  } else {
    logger.warn(message, logMeta);
  }

  // In production, never leak internal 500 details to the client
  const clientMessage =
    statusCode >= 500 && !isOperational && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : message;

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId: req.id,
    errors: err.errors || [],
  });
};
