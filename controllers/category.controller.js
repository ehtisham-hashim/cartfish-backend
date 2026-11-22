import fs from "fs/promises";
import Joi from "joi";
import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const categoryValidation = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
}).options({ stripUnknown: true });

const toSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const createCategory = asyncHandler(async (req, res) => {
  try {
    const { error, value } = categoryValidation.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);
    if (!req.file) throw new ApiError(400, "Category icon image is required");

    const slug = toSlug(value.name);
    const exists = await Category.exists({
      $or: [{ slug }, { name: value.name }],
    });
    if (exists) throw new ApiError(409, "Category already exists");

    const newCategory = await Category.create({
      name: value.name,
      slug,
      icon: req.file.filename,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newCategory, "Category added successfully"));
  } catch (err) {
    // Rollback: remove uploaded file from disk if validation or DB write fails!
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    throw err;
  }
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort("name").select("-__v").lean();
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});
