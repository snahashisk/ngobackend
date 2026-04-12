import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Volunteer } from "../models/volunteer.model.js";
import { generateOTP } from "../utils/generateOtp.js";
import bcrypt from "bcrypt";

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

const registerVolunteer = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    address,
    city,
    state,
    zipCode,
    country,
    avatar,
    age,
    gender,
    idProof,
    preferredCauses,
    contributionAreas,
    availability,
  } = req.body;
  if (
    !fullName ||
    !email ||
    !password ||
    !phoneNumber ||
    !address ||
    !city ||
    !state ||
    !zipCode ||
    !country ||
    !avatar ||
    !age ||
    !gender ||
    !idProof ||
    !preferredCauses ||
    !contributionAreas ||
    !availability
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingVolunteer = await Volunteer.findOne({ email });
  if (existingVolunteer) {
    throw new ApiError(400, "Volunteer already exists");
  }
  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; //10 minutes
  const hashedOtp = await bcrypt.hash(otp, 10);

  try {
    const volunteer = await Volunteer.create({
      fullName,
      email,
      password,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      country,
      avatar,
      age,
      gender,
      idProof,
      preferredCauses,
      contributionAreas,
      availability,
      otp: hashedOtp,
      otpExpiry,
      isVerified: false,
    });
    console.log("OTP:", otp);

    const createdVolunteer = await Volunteer.findById(volunteer._id).select("-password -refreshToken -otp -otpExpiry");

    return res
      .status(201)
      .json(new ApiResponse(200, createdVolunteer, "Volunteer registered successfully. OTP sent successfully."));
  } catch (error) {
    throw new ApiError(500, "Failed to register volunteer");
  }
});

const verifyVolunteer = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }
  const volunteer = await Volunteer.findOne({ email });
  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }
  if (volunteer.isVerified) {
    throw new ApiError(400, "Volunteer already verified");
  }
  if (volunteer.otpExpiry < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }
  const isOtpValid = await bcrypt.compare(otp, volunteer.otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
  }
  volunteer.isVerified = true;
  volunteer.otp = undefined;
  volunteer.otpExpiry = undefined;
  await volunteer.save({ validateBeforeSave: false });
  const verifiedVolunteer = await Volunteer.findById(volunteer._id).select("-password -refreshToken -otp -otpExpiry");
  return res.status(200).json(new ApiResponse(200, verifiedVolunteer, "Volunteer verified successfully"));
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const volunteer = await Volunteer.findOne({ email });
  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }
  if (volunteer.isVerified) {
    throw new ApiError(400, "Volunteer already verified");
  }

  //check if the otp is not expired
  if (volunteer.otpExpiry > Date.now()) {
    throw new ApiError(400, "Please wait for 10 minutes before resending OTP");
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; //10 minutes
  const hashedOtp = await bcrypt.hash(otp, 10);
  volunteer.otp = hashedOtp;
  volunteer.otpExpiry = otpExpiry;
  await volunteer.save();

  const resendOtpVolunteer = await Volunteer.findById(volunteer._id).select("-password -refreshToken -otp -otpExpiry");
  console.log("OTP:", otp);
  return res.status(200).json(new ApiResponse(200, resendOtpVolunteer, "OTP resent successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await Volunteer.findOne({ email });

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

  const loggedInUser = await Volunteer.findById(user._id).select("-password -refreshToken -otp -otpExpiry");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  await Volunteer.findByIdAndUpdate(
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
    secure: true,
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

export { registerVolunteer, verifyVolunteer, resendOtp, loginUser, logoutUser, getCurrentUser };
