import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { sendMessage, getMessagesByReportId } from "../controllers/message.controller.js";

const messageRouter = Router();

messageRouter.route("/").post(verifyJWT, sendMessage);
messageRouter.route("/report/:reportId").get(verifyJWT, getMessagesByReportId);

export { messageRouter };