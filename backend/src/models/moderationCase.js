import mongoose from "mongoose";

const moderationCaseSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["Post", "Product"],
    },
    reason: {
      type: String, // e.g., "Hate Speech detected"
      required: true,
    },
    flaggedContentSnippet: {
      type: String, // The specific text that triggered the alarm
    },
    aiConfidence: {
      type: String, // e.g., "High", "Medium"
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED_BANNED", "RESOLVED_DISMISSED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ModerationCase", moderationCaseSchema);
