import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductSuggestions,
  getSingleProduct,
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { uploadProductImages } from "../middleware/multer.middleware.js";

const router = express.Router();

// 1. Public catalog routes — static "/suggestions" MUST sit ABOVE "/:id"!
router.get("/", getAllProducts);
router.get("/suggestions", getProductSuggestions);
router.get("/:id", getSingleProduct);

// 2. Protected routes — Sellers & Admins can upload up to 8 images
router.post(
  "/",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  uploadProductImages.array("images", 8),
  createProduct,
);

// 3. Protected delete — Logged in user (admin or owner checked inside controller)
router.delete("/:id", verifyJWT, deleteProduct);

export default router;
