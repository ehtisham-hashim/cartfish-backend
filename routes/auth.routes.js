import express from "express";
import passport from "passport";
import {
  googleAuthCallback,
  facebookAuthCallback,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Google Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/dashboard",
  }),
  googleAuthCallback,
);

// Facebook Routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["public_profile", "email"] }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "http://localhost:5173/dashboard",
  }),
  facebookAuthCallback,
);

export default router;
