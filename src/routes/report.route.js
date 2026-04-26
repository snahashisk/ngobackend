import { Router } from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  addVote,
  joinReport,
  getSixMostRecentReports,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { aiReportAnalysisMiddleware } from "../middleware/gemini,middleware.js";

const reportRouter = Router();

reportRouter.route("/report").post(verifyJWT, upload.single("imageOfReport"), aiReportAnalysisMiddleware, createReport);

reportRouter.route("/reports").get(verifyJWT, getAllReports);

reportRouter.route("/reports/:id").get(verifyJWT, getReportById);

reportRouter.route("/vote").post(verifyJWT, addVote);

reportRouter.route("/join").post(verifyJWT, joinReport);

reportRouter.route("/sixMostRecentReports").get(getSixMostRecentReports);

export { reportRouter };
