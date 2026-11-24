import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import Joi from "joi";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

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
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { "ratingSummary.average": -1 },
};

// GET /api/v1/products — Catalog with pagination, filters, search & sorting
export const getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(req.query.perPage, 10) || 8),
  );
  const {
    category: queryCategory,
    search: querySearch,
    minPrice,
    maxPrice,
    sort,
  } = req.query;

  const query = {};

  // 1. Filter by category slug or case-insensitive category name
  if (queryCategory) {
    const cleanCat = queryCategory.trim().toLowerCase();
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: cleanCat },
        { name: new RegExp(`^${escapeRegex(queryCategory.trim())}$`, "i") },
      ],
    })
      .select("_id")
      .lean();

    if (!categoryDoc) throw new ApiError(404, "Category not found");
    query.category = categoryDoc._id;
  }

  // 2. Search by title keyword (case-insensitive, ReDoS-safe)
  if (querySearch?.trim()) {
    query.title = { $regex: escapeRegex(querySearch.trim()), $options: "i" };
  }

  // 3. Price range filter ($gte / $lte)
  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (!Number.isNaN(min)) (query.price ??= {}).$gte = min;
  if (!Number.isNaN(max)) (query.price ??= {}).$lte = max;

  // 4. Sort order from whitelist (default: newest)
  const sortOrder = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  // 5. Run catalog fetch and total count in parallel
  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .select("title slug price stock images ratingSummary createdAt")
      .sort(sortOrder)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Product.countDocuments(query),
  ]);

  // 6. Map first image as cover thumbnail
  const cards = products.map(({ images, ...rest }) => ({
    ...rest,
    thumbnail: images?.[0] || null,
  }));

  const totalPages = Math.ceil(totalProducts / perPage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: cards,
        totalProducts,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
      },
      "Products fetched successfully",
    ),
  );
});
// GET /api/v1/products/suggestions?search=ip — Fast autocomplete suggestions
export const getProductSuggestions = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim() || "";
  if (search.length < 2) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Enter at least 2 characters"));
  }

  const products = await Product.find({
    title: { $regex: escapeRegex(search), $options: "i" },
  })
    .select("_id title slug price")
    .limit(10)
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Suggestions fetched successfully"));
});

// GET /api/v1/products/:id — Single Product detail with populated relations
export const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  const product = await Product.findById(id)
    .populate("seller", "_id name email")
    .populate("category", "_id name slug")
    .populate("reviews.user", "_id name")
    .select("-__v")
    .lean();

  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

// DELETE /api/v1/products/:id — Admin or Owning Seller only (cleans up images)
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  const product = await Product.findById(id).select("seller images");
  if (!product) throw new ApiError(404, "Product not found");

  const isOwner = req.user._id.equals(product.seller);
  if (req.user.role !== "admin" && !isOwner) {
    throw new ApiError(
      403,
      "Forbidden - Only admin or the product seller can delete this product",
    );
  }

  await product.deleteOne();

  // Clean up all product images from disk
  if (product.images?.length > 0) {
    await Promise.allSettled(
      product.images.map((imageName) => {
        const safeFile = path.basename(imageName);
        const fullPath = path.resolve("upload", "products", safeFile);
        return fs.unlink(fullPath).catch((err) => {
          console.warn(`Could not delete image ${safeFile}:`, err.message);
        });
      }),
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"));
});
