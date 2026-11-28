import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import logger, { morganStream } from "./config/logger.js";
import { registerProcessHandlers } from "./utils/shutdown.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import "./config/passport.js";

let server;
// Register fatal crash & SIGTERM handlers BEFORE booting anything!
registerProcessHandlers(() => server);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(requestIdMiddleware);
app.use(cors());
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: morganStream,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static assets
app.use("/upload/category", express.static("upload/category"));
app.use("/upload/products", express.static("upload/products"));

// Versioned APIs
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/products", productRoutes);

// 404 Catch-All + Global Error Middleware (MUST stay at the very bottom!)
app.use(notFoundHandler);
app.use(errorHandler);

await connectDB();
server = app.listen(PORT, () =>
  logger.info(`CartFish server running on port ${PORT}`),
);
