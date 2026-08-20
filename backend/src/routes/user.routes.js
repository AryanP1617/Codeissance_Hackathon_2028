import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const user_router = Router();

// Public Authentication Routes
user_router.route("/register").post(registerUser);
user_router.route("/login").post(loginUser);

// Secured Authentication Routes
user_router.route("/logout").post(verifyJwt, logoutUser);
user_router.route("/current-user").get(verifyJwt, getCurrentUser);
user_router.route("/me").get(verifyJwt, getCurrentUser);

export default user_router;
