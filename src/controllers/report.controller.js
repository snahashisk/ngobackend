import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const createReport = asyncHandler(async (req, res) => {
  const {
    reporterName,
    reporterEmail,
    title,
    category,
    description,
    affectedPeople,
    stepsToResolve,
    urgencyLevel,
    landmark,
    address,
    locality,
    city,
    state,
    pinCode,
    country,
  } = req.body;
  if (
    !reporterName ||
    !reporterEmail ||
    !title ||
    !description ||
    !category ||
    !affectedPeople ||
    !stepsToResolve ||
    !urgencyLevel ||
    !landmark ||
    !address ||
    !locality ||
    !city ||
    !state ||
    !pinCode ||
    !country
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let imageOfReportLocalPath = "";

  if (req.file) {
    imageOfReportLocalPath = req.file.path;
  }

  if (!imageOfReportLocalPath) {
    throw new ApiError(400, "Image file is required");
  }

  try {
    const imageOfReport = await uploadOnCloudinary(imageOfReportLocalPath);

    if (!imageOfReport) {
      throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    //find all the users with same city
    const potentialVolunteers = await User.find({
      city: city,
      isVerified: true,
    });

    const nearByVolunteers = await User.find({
      state: state,
      isVerified: true,
    });

    const report = await Report.create({
      reporterName,
      reporterEmail,
      title,
      description,
      category,
      landmark,
      address,
      locality,
      city,
      state,
      pinCode,
      country,
      imageOfReport: imageOfReport.url,
      urgencyLevel,
      affectedPeople,
      stepsToResolve,
      reportedBy: req.user._id,
      status: "Pending",
      potentialVolunteers: potentialVolunteers.map((v) => v._id),
    });

    res.status(201).json(new ApiResponse(201, report, "Report created successfully"));

    setImmediate(async () => {
      try {
        if (!nearByVolunteers.length) {
          console.log("No volunteers found for notification");
          return;
        }
        await Promise.allSettled(
          nearByVolunteers.map(async (v) => {
            const html = `
            <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: Arial, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px">
      <tr>
        <td align="center">
          <table
            width="100%"
            style="
              max-width: 600px;
              background: #ffffff;
              border-radius: 12px;
              padding: 30px;
            "
          >
            <tr>
              <td align="center" style="padding-bottom: 20px">
                <h2 style="margin: 0; color: #111">GoodDeed Foundation</h2>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px">
                  AI-Powered Crisis Response Platform
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 20px">
                <h3 align="center" style="margin: 0; color: #dc2626">
                  New Case Registered
                </h3>
                <p style="color: #555; font-size: 14px">
                  A new case has been reported on the platform. Please log in to
                  your dashboard to verify and take necessary action.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 10px;
                  font-size: 14px;
                  color: #333;
                  line-height: 1.6;
                "
              >
                <p><b>Title:</b> ${title}</p>
                <p><b>Category:</b> ${category}</p>
                <p>
                  <b>Description:</b><br />
                  ${description}
                </p>
                <p>
                  <b>Location:</b><br />
                  ${landmark}, ${address}<br />
                  ${locality}, ${city}, ${state}
                </p>

                <p><b>Urgency Level:</b> ${urgencyLevel}</p>
                <p><b>Affected People:</b> ${affectedPeople}</p>
                <p>
                  <b>Suggested Steps:</b><br />
                  ${stepsToResolve}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px; font-size: 13px; color: #666">
                <p>
                  For security reasons, actions can only be performed after
                  logging into the platform.
                </p>
                <p>
                  If you did not expect this notification, you may ignore this
                  email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 0">
                <hr style="border: none; border-top: 1px solid #eee" />
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 12px; color: #999">
                <p style="margin: 0">© 2026 GoodDeed Foundation</p>
                <p style="margin: 5px 0 0">
                  Empowering communities through technology
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
            return sendEmail({ to: v.email, subject: "New Crisis Report Verification", html: html });
          }),
        );
        console.log(`Emails sent to ${nearByVolunteers.length} volunteers`);
      } catch (error) {
        console.error("Send Email Error:", error);
      }
    });
    setTimeout(() => {}, 5 * 60 * 1000);
  } catch (error) {
    console.error("Create Report Error:", error);
    throw new ApiError(500, error?.message || "Failed to create report");
  }
});

const getAllReports = asyncHandler(async (req, res) => {
  try {
    const reports = await Report.find();
    return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
  } catch (error) {
    console.error("Get All Reports Error:", error);
    throw new ApiError(500, error?.message || "Failed to get reports");
  }
});

const getSixMostRecentReports = asyncHandler(async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(9);
    return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully"));
  } catch (error) {
    console.error("Get Six Most Recent Reports Error:", error);
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

const voteFromEmail = asyncHandler(async (req, res) => {
  try {
    const { token, type } = req.query;

    if (!token || !type) {
      throw new ApiError(400, "Token and type are required");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      throw new ApiError(401, "Invalid token");
    }
    const { userId, reportId } = decodedToken;

    const report = await Report.findById(reportId);

    const alreadyVoted = report.verifiedBy.some((id) => id.toString() === userId.toString());

    if (alreadyVoted) {
      return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vote Added</title>
      </head>
      <body>
        <h1>Vote Added Successfully</h1>
        <p>Thank you for your vote. Your vote has been added successfully.</p>
      </body>
      </html>
      `);
    }

    if (type === "positive") {
      report.positiveVerification += 1;
    } else {
      report.negativeVerification += 1;
    }
    report.verifiedBy.push(userId);
    await report.save();
    //send html response
    return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vote Added</title>
    </head>
    <body>
      <h1>Vote Added Successfully</h1>
      <p>Thank you for your vote. Your vote has been added successfully.</p>
    </body>
    </html>
    `);
  } catch (error) {
    console.error("Vote From Email Error:", error);
    return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vote Could Not Be Added</title>
    </head>
    <body>
      <h1>Vote Could Not Be Added</h1>
      <p>Thank you for your time. Your vote could not be added successfully.</p>
    </body>
    </html>
    `);
  }
});

const addVote = asyncHandler(async (req, res) => {
  const { reportId, type } = req.body;
  const user = req.user;
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  //check if the user has already voted
  const alreadyVoted = report.verifiedBy.some((id) => id.toString() === user._id.toString());
  if (alreadyVoted) {
    throw new ApiError(400, "You have already voted for this report.");
  }

  try {
    if (type === "positive") {
      report.positiveVerification += 1;
    } else {
      report.negativeVerification += 1;
    }
    report.verifiedBy.push(user._id);
    await report.save();

    const updateReport = await Report.findById(reportId);

    if (updateReport.positiveVerification >= 5) {
      updateReport.status = "Verified";
      updateReport.isVerified = true;
      await updateReport.save();
      console.log("Report Verified Successfully");
    } else if (
      updateReport.negativeVerification >= 5 &&
      updateReport.positiveVerification < updateReport.negativeVerification
    ) {
      updateReport.status = "Rejected";
      await updateReport.save();
      console.log("Report Rejected Successfully");
    }

    return res.status(200).json(new ApiResponse(200, updateReport, "Vote added successfully"));
  } catch (error) {
    console.error("Failed to add vote.", error);
    throw new ApiError(500, error?.message || "Failed to add vote");
  }
});

const joinReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.body;
    const user = req.user;
    const report = await Report.findById(reportId);
    if (!report) {
      throw new ApiError(404, "Report not found");
    }
    //add user to assigned members if he is not already assigned
    if (report.assignedMembers.includes(user._id)) {
      throw new ApiError(400, "You are already assigned to this report.");
    }
    report.status = "InProgress";
    report.assignedMembers.push(user._id);
    await report.save();
    return res.status(200).json(new ApiResponse(200, report, "Report joined successfully."));
  } catch (error) {
    console.error("Failed to join report.", error);
    throw new ApiError(500, error?.message || "Failed to join report");
  }
});

const joinReportasCaptain = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.body;
    const user = req.user;
    const report = await Report.findById(reportId);
    if (!report) {
      throw new ApiError(404, "Report not found");
    }
    //add user to assigned members if he is not already assigned
    if (report.assignedMembers.includes(user._id)) {
      throw new ApiError(400, "You are already assigned to this report.");
    }
    report.status = "InProgress";
    report.captain = user._id;
    await report.save();
    return res.status(200).json(new ApiResponse(200, report, "Report joined successfully."));
  } catch (error) {
    console.error("Failed to join report.", error);
    throw new ApiError(500, error?.message || "Failed to join report");
  }
});

export { createReport, getAllReports, getReportById, voteFromEmail, addVote, joinReport, getSixMostRecentReports };
