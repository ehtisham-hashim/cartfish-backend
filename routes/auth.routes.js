import express from "express";
import passport from "passport-google-oauth2";

const router = express.Router;

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
);

export default router;
