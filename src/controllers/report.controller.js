import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";

const createReport = asyncHandler(async (req, res) => {
  const { title, description, category, address, city, state, pinCode, country, images } = req.body;
  if (!title || !description || !category || !address || !city || !state || !pinCode || !country || !images) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const report = await Report.create({
      title,
      description,
      category,
      address,
      city,
      state,
      pinCode,
      country,
      images,
      reportedBy: req.user._id,
      status: "pending",
    });
    return res.status(201).json(new ApiResponse(200, report, "Report created successfully"));
  } catch (error) {
    console.error("Create Report Error:", error);
    throw new ApiError(500, error?.message || "Failed to create report");
  }
});

//demo json body to create report
/*
{
  "title": "Report Title",
  "description": "Report Description",
  "category": "Report Category",
  "address": "Report Address",
  "city": "Report City",
  "state": "Report State",
  "pinCode": "Report Pin Code",
  "country": "Report Country",
  "images": ["Report Image 1", "Report Image 2"]
}
*/

const getAllReports = asyncHandler(async (req, res) => {
  try {
    const reports = await Report.find();
    return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
  } catch (error) {
    console.error("Get All Reports Error:", error);
    throw new ApiError(500, error?.message || "Failed to get reports");
  }
});

const getReportById = asyncHandler(async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    return res.status(200).json(new ApiResponse(200, report, "Report fetched successfully"));
  } catch (error) {
    console.error("Get Report By Id Error:", error);
    throw new ApiError(500, error?.message || "Failed to get report");
  }
});

export { createReport, getAllReports, getReportById };
