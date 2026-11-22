import express from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import "./config/passport.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Main APIs
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/category", categoryRoutes);

// Serve uploaded images statically
app.use("/upload/category", express.static("upload/category"));
app.use("/upload/products", express.static("upload/products"));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[Server Error 500] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[Client Error ${statusCode}] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

await connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
