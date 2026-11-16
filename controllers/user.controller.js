import Joi from "joi";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import hashPass from "../utils/hashPassword.js";
import jwt from "jsonwebtoken";

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

  const token = jwt.sign(
    { _id: newUser._id, name: newUser.name },
    process.env.JWT_KEY,
    {
      expiresIn: "2d",
    },
  );

  return res
    .status(201)
    .json(new ApiResponse(201, token, "User created successfully"));
});

const loginUserSchema = Joi.object({
  email: Joi.string().email().min(6).required(),
  password: Joi.string().min(8).required(),
});

export const loginUser = asyncHandler(async (req, res) => {
  //Validatig the fields are even entered or not
  const { error } = loginUserSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  const { email, password } = req.body;
  //finding user from the db brother--nothing else
  const user = await User.findOne({ email });
  if (!user) {
    //No user - No enterance
    throw new ApiError(401, "Invalid credentials");
  }
  //Comparing wives..Sorry Password
  //I don't have one btw.
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new ApiError(401, "Invalid credentials");
  }
  //create token
  const token = jwt.sign(
    { _id: user._id, name: user.name },
    process.env.JWT_KEY,
    {
      expiresIn: "2d",
    },
  );
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
      },
      "Login successful",
    ),
  );
});
