import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { generateOTP } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    address,
    city,
    locality,
    state,
    zipCode,
    country,
    age,
    gender,
    education,
    profession,
    contributionAreas,
  } = req.body;

  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let idProofLocalPath;
  if (req.files && Array.isArray(req.files.idProof) && req.files.idProof.length > 0) {
    idProofLocalPath = req.files.idProof[0].path;
  }

  if (
    !fullName ||
    !email ||
    !password ||
    !phoneNumber ||
    !age ||
    !gender ||
    !address ||
    !state ||
    !city ||
    !locality ||
    !zipCode ||
    !country ||
    !education ||
    !profession ||
    !contributionAreas
  ) {
    throw new ApiError(401, "All fields are required!");
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  if (!idProofLocalPath) {
    throw new ApiError(400, "ID proof file is required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const idProof = await uploadOnCloudinary(idProofLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (!idProof) {
    throw new ApiError(500, "Failed to upload ID proof");
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; //10 minutes
  const hashedOtp = await bcrypt.hash(otp, 10);

  try {
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      address,
      locality,
      city,
      state,
      zipCode,
      country,
      age,
      gender,
      education,
      profession,
      contributionAreas,
      avatar: avatar.url,
      idProof: idProof.url,
      otp: hashedOtp,
      otpExpiry,
    });
    console.log("OTP:", otp);

    const createdUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");

    //send email to the user
    await sendEmail({
      to: email,
      subject: "OTP for verification",
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f4f7;
      font-family: Arial, sans-serif;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f4f4f7; padding: 20px"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            max-width="500px"
            cellpadding="0"
            cellspacing="0"
            style="
              background-color: #ffffff;
              border-radius: 10px;
              padding: 30px;
            "
          >
            <tr>
              <td align="center" style="padding-bottom: 20px">
                <h2 style="margin: 0; color: #111">GoodDeed Foundation</h2>
                <p style="margin: 5px 0 0; color: #777; font-size: 14px">
                  AI-Powered Platform Connecting Volunteers
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="color: #333; font-size: 16px; line-height: 1.5">
                <p>Hello,</p>
                <p>
                  Use the following One-Time Password (OTP) to complete your
                  verification:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0">
                <div
                  style="
                    display: inline-block;
                    padding: 15px 30px;
                    font-size: 28px;
                    letter-spacing: 5px;
                    font-weight: bold;
                    color: #ffffff;
                    background-color: #4f46e5;
                    border-radius: 8px;
                  "
                >
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Info -->
            <tr>
              <td style="color: #555; font-size: 14px">
                <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                <p>
                  If you did not request this, you can safely ignore this email.
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
                <p style="margin: 0">
                  © 2026 GoodDeed Foundation. All rights reserved.
                </p>
                <p style="margin: 5px 0 0">Need help? Contact support.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully. OTP sent successfully."));
  } catch (error) {
    console.error("REGISTER ERROR:", error); // 🔥 ADD THIS
    throw new ApiError(500, error.message || "Failed to register User");
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    throw new ApiError(400, "userId and OTP are required");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isVerified) {
    throw new ApiError(400, "User already verified");
  }
  if (user.otpExpiry < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }
  const isOtpValid = await bcrypt.compare(otp, user.otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save({ validateBeforeSave: false });
  const verifiedUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");
  return res.status(200).json(new ApiResponse(200, verifiedUser, "User verified successfully"));
});

const resendOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isVerified) {
    throw new ApiError(400, "User already verified");
  }

  //check if the otp is not expired
  if (user.otpExpiry > Date.now()) {
    throw new ApiError(400, "Please wait for 10 minutes before resending OTP");
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; //10 minutes
  const hashedOtp = await bcrypt.hash(otp, 10);
  user.otp = hashedOtp;
  user.otpExpiry = otpExpiry;
  await user.save();

  const resendOtpUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");
  console.log("OTP:", otp);
  return res.status(200).json(new ApiResponse(200, resendOtpUser, "OTP resent successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new ApiError(400, "User not verified");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(
    _id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { returnDocument: "after" },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export { registerUser, verifyUser, resendOtp, loginUser, logoutUser, getCurrentUser };
