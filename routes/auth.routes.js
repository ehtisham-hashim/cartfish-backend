import express from "express";
import passport from "passport";
import { googleAuthCallback } from "../controllers/auth.controller.js";

const router = express.Router();

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

export default router;
