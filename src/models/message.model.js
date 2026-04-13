import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: [true, "Chat room ID is required"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
  },
  { timestamps: true },
);

export const Message = mongoose.model("Message", messageSchema);
