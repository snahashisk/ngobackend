import mongoose from "mongoose";

const resolutionReportSchema = new mongoose.Schema(
  {
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
    images: [
      {
        type: String,
      },
    ],
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
