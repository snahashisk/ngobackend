import mongoose, { Schema } from "mongoose";

const REPORT_CATEGORIES = [
  "Food Shortage",
  "Water Crisis",
  "Medical Emergency",
  "Shelter Needed",
  "Disaster Relief",
  "Education Support",
  "Sanitation Issue",
  "Women & Child Safety",
  "Elderly Support",
  "Animal Welfare",
  "Environmental Issue",
  "Other",
];

const reportSchema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported by is required"],
    },
    reporterName: {
      type: String,
      required: [true, "Reporter name is required"],
      trim: true,
    },
    reporterEmail: {
      type: String,
      required: [true, "Reporter email is required"],
      trim: true,
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
    affectedPeople: {
      type: Number,
      required: [true, "Number of affected people is required"],
    },
    stepsToResolve: {
      type: String,
      trim: true,
    },
    imageOfReport: {
      type: String,
      required: [true, "Image of report is required"],
    },
    urgencyLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    landmark: {
      type: String,
      trim: true,
      required: [true, "Landmark is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, "Locality is required"],
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
    status: {
      type: String,
      enum: ["Pending", "Verified", "InProgress", "Resolved", "Rejected"],
      default: "Pending",
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
    captain: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
