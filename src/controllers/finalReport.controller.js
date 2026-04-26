import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Report } from "../models/report.model.js";
import { ResolutionReport } from "../models/finalReport.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createFinalReport = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { reportId, actionsTaken, outcome, peopleHelped, remarks, status } = req.body;

    // 1. Basic Validation
    if (!reportId) {
      throw new ApiError(400, "Report ID is required");
    }
    if (!actionsTaken || !outcome || peopleHelped == null) {
      throw new ApiError(400, "Missing required fields");
    }

    // 2. Fetch Report
    const report = await Report.findById(reportId);
    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    // 3. Image Handling
    let imageUrl;
    const imageLocalPath = req.file?.path;
    
    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required");
    }

    const uploaded = await uploadOnCloudinary(imageLocalPath);
    if (!uploaded) throw new ApiError(500, "Image upload failed");
    imageUrl = uploaded.url;

    // 4. Create Final Report
    const finalReport = await ResolutionReport.create({
      reporterId: user._id,
      report: reportId,
      actionsTaken,
      outcome,
      peopleHelped,
      image: imageUrl,
      remarks: remarks || "",
      status: status || "Completed",
    });

    // 5. Mark Original Report as Resolved (optional — adjust if you use status field)
    await Report.findByIdAndUpdate(reportId, { status: "Resolved" });

    return res.status(201).json(new ApiResponse(201, finalReport, "Final report created successfully"));
  } catch (error) {
    console.error("Create Final Report Error:", error);
    throw new ApiError(500, error?.message || "Failed to create final report");
  }
});

export { createFinalReport };
