import { Router } from "express";
import { createFinalReport } from "../controllers/finalReport.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const finalReportRouter = Router();

finalReportRouter.route("/create").post(verifyJWT, upload.single("image"), createFinalReport);

export { finalReportRouter };
