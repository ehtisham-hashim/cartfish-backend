import fs from "fs/promises";
import crypto from "crypto";
import Joi from "joi";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createProductSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().min(50).max(5000).required(),
  category: Joi.string().hex().length(24).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
}).options({ stripUnknown: true });

const makeProductSlug = (title) => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
};

const cleanupUploadedFiles = async (files = []) => {
  await Promise.allSettled(
    files.map((file) => fs.unlink(file.path).catch(() => {})),
  );
};

// POST /api/v1/products — Sellers & Admins only, up to 8 images
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);

    const files = req.files || [];
    if (files.length === 0) {
      throw new ApiError(400, "At least one product image is required");
    }

    const categoryExists = await Category.exists({ _id: value.category });
    if (!categoryExists) {
      throw new ApiError(404, "Selected category does not exist");
    }

    const newProduct = await Product.create({
      ...value,
      slug: makeProductSlug(value.title),
      images: files.map((file) => file.filename),
      seller: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newProduct, "Product created successfully"));
  } catch (err) {
    // Atomic rollback: never leave orphan images on disk if anything throws!
    await cleanupUploadedFiles(req.files);
    throw err;
  }
});
