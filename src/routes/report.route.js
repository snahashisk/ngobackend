import { Router } from "express";
import { createReport, getAllReports, getReportById, voteFromEmail } from "../controllers/report.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const reportRouter = Router();

reportRouter.route("/report").post(verifyJWT, createReport);

reportRouter.route("/reports").get(verifyJWT, getAllReports);

reportRouter.route("/reports/:id").get(verifyJWT, getReportById);

reportRouter.route("/vote").get(voteFromEmail);

export { reportRouter };
