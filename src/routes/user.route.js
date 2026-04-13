import { Router } from "express";
import {
  registerUser,
  verifyUser,
  resendOtp,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const UserRouter = Router();

UserRouter.route("/register").post(registerUser);
UserRouter.route("/verify").post(verifyUser);
UserRouter.route("/resend-otp").post(resendOtp);
UserRouter.route("/login").post(loginUser);
UserRouter.route("/logout").post(verifyJWT, logoutUser);
UserRouter.route("/current-user").get(verifyJWT, getCurrentUser);

export { UserRouter };
