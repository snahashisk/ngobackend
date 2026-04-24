import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CONTRIBUTION_AREAS } from "../../constant.js";

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      min: [8, "Password must be at least 8 characters long"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      min: [10, "Phone number must be at least 10 digits long"],
      max: [15, "Phone number must be at most 15 digits long"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, "Locality is required"],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    education: {
      type: String,
      required: [true, "Education is required"],
      trim: true,
    },
    profession: {
      type: String,
      required: [true, "Profession is required"],
      trim: true,
    },
    contributionAreas: {
      type: [String],
      enum: CONTRIBUTION_AREAS,
      required: [true, "Contribution areas are required"],
      trim: true,
    },
    idProof: {
      type: String,
      required: [true, "ID proof is required"],
      trim: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    refreshToken: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.email,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIREY,
    },
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIREY,
    },
  );
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

//demo json body for UserSchema
/*
{
  "fullName": "John Doe",
  "email": "[EMAIL_ADDRESS]",
  "password": "password",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "New York",
  "zipCode": "12345",
  "country": "USA",
  "avatar": "https://example.com/avatar.jpg",
  "age": 25,
  "gender": "Male",
  "idProof": "https://example.com/idProof.jpg",
  "preferredCauses": ["education", "health"],
  "contributionAreas": ["education", "health"],
  "availability": {
    "days": ["monday", "tuesday"],
    "timeSlots": ["morning", "afternoon"],
  },
}
*/
