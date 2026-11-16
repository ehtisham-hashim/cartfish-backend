import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  //Get the token from header or cookie
  const token =
    req.cookies?.token || req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unauthorized - No token provided");
  }
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);

  const user = await User.findById(decodedToken._id).select("-password");
  if (!user) {
    throw new ApiError(401, "Token expired");
  }
  req.user = user;
  next();
});
