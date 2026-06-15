import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
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
    title: { type: String, default: "New conversation", trim: true },
    // Mirrors the Redis sessionId so a session can be resolved to a thread.
    sessionId: { type: String, required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Fast "latest conversations for this project" lookups.
conversationSchema.index({ userId: 1, projectId: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
