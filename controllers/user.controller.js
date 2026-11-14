import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, deliveryAddress } = req.body;
  if (!email || !password || !name || !deliveryAddress) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(409, "User already exists");
  }

  const newUser = await User.create({
    name,
    email,
    password,
    deliveryAddress,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User created successfully"));
});
