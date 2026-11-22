import express from "express";
import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { uploadCategoryIcon } from "../middleware/multer.middleware.js";

const router = express.Router();

// Public: Anyone can view categories
router.get("/", getAllCategories);

// Protected: Only Admin can create a category with icon upload
router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  uploadCategoryIcon.single("icon"),
  createCategory,
);

export default router;
