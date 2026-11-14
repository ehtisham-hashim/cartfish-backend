import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
      role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user",
      },
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
      required: true,
      minLength: [8, "Email must be 6 characters long"],
      trim: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
