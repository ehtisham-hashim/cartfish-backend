import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const profile = req.user;
  const email = profile.emails?.[0]?.value || profile.email;
  //Check if user exists by google ID or email
  let user = await User.findOne({
    $or: [{ googleId: profile.id }, { email }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
  } else {
    user = await User.create({
      name: profile.displayName || profile?.name?.givenName || "User",
      email,
      googleId: profile.id,
    });
  }
  const token = generateToken({ _id: user._id, name: user.name });
  res.redirect(`http://localhost:5173/dashboard?token=${token}`);
});

export const facebookAuthCallback = asyncHandler(async (req, res) => {
  const profile = req.user;
  const email = profile.emails?.[0]?.value;

  // Search by facebookId or email (if email is provided)
  const query = [{ facebookId: profile.id }];
  if (email) {
    query.push({ email });
  }

  let user = await User.findOne({ $or: query });

  if (user) {
    if (!user.facebookId) {
      user.facebookId = profile.id;
      await user.save();
    }
  } else {
    user = await User.create({
      name:
        profile.displayName ||
        `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
        "User",
      email: email || `fb_${profile.id}@cartfish.local`,
      facebookId: profile.id,
    });
  }

  const token = generateToken({ _id: user._id, name: user.name });
  res.redirect(`http://localhost:5173/dashboard?token=${token}`);
});
