import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    // Denormalized for ownership checks and cleanup without a join.
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, default: "" },
    model: { type: String, default: "" }, // which model produced it
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Chronological reads of a single conversation.
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
