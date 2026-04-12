import { Router } from "express";
import {
  registerVolunteer,
  verifyVolunteer,
  resendOtp,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/volunteer.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const volunteerRouter = Router();

volunteerRouter.route("/register").post(registerVolunteer);
volunteerRouter.route("/verify").post(verifyVolunteer);
volunteerRouter.route("/resend-otp").post(resendOtp);
volunteerRouter.route("/login").post(loginUser);
volunteerRouter.route("/logout").post(verifyJWT, logoutUser);
volunteerRouter.route("/current-user").get(verifyJWT, getCurrentUser);

export { volunteerRouter };
