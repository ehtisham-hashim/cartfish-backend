import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      minlength: [6, "Email must be 6 characters long"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      minLength: [8, "Password must be 8 characters long"],
      trim: true,
    },
    googleId: {
      type: String,
    },
    facebookId: {
      type: String,
    },
    deliveryAddress: {
      type: String,
      required: false,
      minlength: [6, "Address must be 6 characters long"],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
