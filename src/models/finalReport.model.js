import mongoose from "mongoose";

const resolutionReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    actionsTaken: {
      type: String,
      required: true,
    },
    outcome: {
      type: String,
      required: true,
    },
    peopleHelped: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Completed", "Partially Completed", "Failed"],
      default: "Completed",
    },
  },
  { timestamps: true },
);

export const ResolutionReport =
  mongoose.models.ResolutionReport || mongoose.model("ResolutionReport", resolutionReportSchema);
