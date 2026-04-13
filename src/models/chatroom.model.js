import mongoose, { Schema } from "mongoose";

const chatRoomSchema = new Schema(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "Report",
      required: [true, "Report ID is required"],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
