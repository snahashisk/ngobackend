import mongoose, { Schema } from "mongoose";

const REPORT_CATEGORIES = [
  "foodShortage",
  "medicalEmergency",
  "naturalDisaster",
  "shelterNeed",
  "waterShortage",
  "animalRescue",
  "other",
];

const reportSchema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported by is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: REPORT_CATEGORIES,
      required: [true, "Category is required"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minLength: [10, "Description must be at least 10 characters long"],
      maxLength: [1000, "Description must be at most 1000 characters long"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
      required: [true, "Images are required"],
    },
    status: {
      type: String,
      enum: ["pending", "verified", "inProgress", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    positiveVerification: {
      type: Number,
      default: 0,
    },
    negativeVerification: {
      type: Number,
      default: 0,
    },
    verifiedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    responseTeam: {
      captain: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    resolutionDetails: {
      summary: {
        type: String,
        trim: true,
      },
      resolutionImages: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true },
);

reportSchema.methods.addVote = async function (userId, voteType) {
  //check if the person has already voted
  if (this.verifiedBy.includes(userId)) {
    throw new Error("You have already voted for this report");
  }

  try {
    if (voteType === "positive") {
      this.positiveVerification++;
      this.verifiedBy.push(userId);
    } else if (voteType === "negative") {
      this.negativeVerification++;
      this.verifiedBy.push(userId);
    }
    await this.save();
  } catch (error) {
    throw new Error("Failed to add vote");
  }
};
//can i make any methods that will help me to manage this?

export const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
