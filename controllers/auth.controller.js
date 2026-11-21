import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const profile = req.user;
  const email = profile.emails?.[0]?.value || profile.email;
  //Check if user exists by google ID or email
  let user = await User.findOne({
    $or: [{ googleId: profile.id }, email],
  });

  if (user) {
    //If user exists , and don't have googleID then link that piece of trash
    if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
  } else {
    //Create that holy man--aka--USER
    user = await User.create({
      name: profile.displayName || profile?.name?.givenName || "User",
      email,
      googleId: profile.id,
    });
  }
  // 3. Generate token with your helper
  const token = generateToken({ _id: user._id, name: user.name });
  res.redirect(`http://localhost:5173/dashboard?token=${token}`);
});
