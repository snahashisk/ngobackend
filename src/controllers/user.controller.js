import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { generateOTP } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
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

const registerUser = asyncHandler(async (req, res) => {
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

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
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

    const createdUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");

    //send email to the user
    await sendEmail({ to: email, subject: "OTP for verification", html: `<h1>Your OTP is ${otp}</h1>` });

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully. OTP sent successfully."));
  } catch (error) {
    throw new ApiError(500, "Failed to register User");
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }
  const user = await User.findOne({ email });
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
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });
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

export { registerUser, verifyUser, resendOtp, loginUser, logoutUser, getCurrentUser };
