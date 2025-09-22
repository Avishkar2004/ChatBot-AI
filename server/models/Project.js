import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    model: { type: String, default: "gpt-4o-mini" },
    provider: {
      type: String,
      enum: ["openai", "openrouter", "other"],
      default: "openai",
    },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, name: 1 }, { unique: true });

const Project = mongoose.model("Project", projectSchema);
export default Project;
