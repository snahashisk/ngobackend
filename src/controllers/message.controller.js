import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Report } from "../models/report.model.js";
import { Message } from "../models/message.model.js";

//Message Controller

//send message
const sendMessage = asyncHandler(async (req, res) => {
  const { reportId, content } = req.body;
  const sender = req.user._id;

  if (!reportId || !content) {
    throw new ApiError(400, "Report ID and content are required");
  }

  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  const message = await Message.create({
    reportId,
    sender,
    fullName: req.user.fullName,
    content,
  });

  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
});

//get messages by report id
const getMessagesByReportId = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user._id;

  if (!reportId) {
    throw new ApiError(400, "Report ID is required");
  }

  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  const isAuthorized =
    report.reportedBy.equals(userId) ||
    report.captain?.equals(userId) ||
    report.assignedMembers.some((member) => member.equals(userId));

  if (!isAuthorized) {
    throw new ApiError(403, "You are not authorized to view this report");
  }

  const messages = await Message.find({ reportId }).sort({ createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, messages, "Messages retrieved successfully"));
});

export { sendMessage, getMessagesByReportId };
