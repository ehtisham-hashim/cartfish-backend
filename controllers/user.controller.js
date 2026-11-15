import Joi from "joi";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import hashPass from "../utils/hashPassword.js";

const createdUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().min(6).required(),
  password: Joi.string().min(8).required(),
  deliveryAddress: Joi.string().min(6).required(),
});

export const registerUser = asyncHandler(async (req, res) => {
  const { error } = createdUserSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { name, email, password, deliveryAddress } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPass = await hashPass(password);

  const newUser = await User.create({
    name,
    email,
    password: hashedPass,
    deliveryAddress,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User created successfully"));
});
