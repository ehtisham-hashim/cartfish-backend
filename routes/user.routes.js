import express from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/profile", verifyJWT, getUserProfile);
export default router;
