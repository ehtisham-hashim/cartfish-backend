import crypto from "crypto";

// Tags every incoming request with a unique ID for end-to-end log tracing
export const requestIdMiddleware = (req, res, next) => {
  const id = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
