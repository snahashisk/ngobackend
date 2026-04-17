import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

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

    res.status(201).json(new ApiResponse(201, report, "Report created successfully"));

    setImmediate(async () => {
      
      try {
        const volunteers = await User.find({
          isVerified: true,
        });
        if (!volunteers.length) {
          console.log("No volunteers found for notification");
          return;
        }
        await Promise.allSettled(
          volunteers.map(async (v) => {
            const token = jwt.sign(
              {
                userId: v._id,
                reportId: report._id,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1h" },
            );

            const positiveLink = `${process.env.BASE_URL}/api/v1/report/vote?token=${token}&type=positive`;
            const negativeLink = `${process.env.BASE_URL}/api/v1/report/vote?token=${token}&type=negative`;

            const html = `
            <h2>🚨 New Crisis Report</h2>
            <p><b>Title:</b> ${title}</p>
            <p><b>Category:</b> ${category}</p>
            <p><b>Description:</b> ${description}</p>
            <p><b>Location:</b> ${city}, ${state}</p>

            <br/>

            <a href="${positiveLink}" 
               style="padding:10px 20px;background:green;color:white;text-decoration:none;">
               ✅ Verify
            </a>

            <a href="${negativeLink}" 
               style="padding:10px 20px;background:red;color:white;text-decoration:none;margin-left:10px;">
               ❌ Reject
            </a>
          `;

            return sendEmail({ to: v.email, subject: "New Crisis Report Verification", html: html });
          }),
        );
        console.log(`Emails sent to ${volunteers.length} volunteers`);
      } catch (error) {
        console.error("Send Email Error:", error);
      }
    });

    //send email to all to help resolve the problem after 1 min of report submission
    setTimeout(() => {

    }, 5 * 60 * 1000);
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

export { createReport, getAllReports, getReportById, voteFromEmail };
