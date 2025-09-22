import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

promptSchema.index({ projectId: 1, title: 1 }, { unique: true });

const Prompt = mongoose.model("Prompt", promptSchema);
export default Prompt;
