import mongoose, { Schema } from "mongoose";

const reviewSubSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true, minlength: 50 },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: {
      type: [String],
      required: true,
      validate: [
        (arr) => arr.length > 0,
        "At least one product image is required",
      ],
    },
    ratingSummary: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    reviews: [reviewSubSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Production Indexes: turns full collection scans into instant index lookups
productSchema.index({ category: 1, price: 1 });
productSchema.index({ "ratingSummary.average": -1 });
productSchema.index({ title: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
