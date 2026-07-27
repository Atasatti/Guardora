import mongoose from "mongoose";

const securityAlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["DANGEROUS_OBJECT", "UNSAFE_AREA", "BANNED_PERSON"],
      required: true,
    },
    status: {
      type: String,
      enum: ["NEW", "REVIEWED", "DISMISSED"],
      default: "NEW",
    },
    cameraName: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    snapshotBase64: {
      type: String, // We'll store the base64 string directly for simplicity in FYP
      required: true,
    },
    details: {
      object: String, // e.g. "Gun", "Person"
      confidence: Number, // e.g. 0.85
    },
  },
  { timestamps: true }
);

export default mongoose.model("SecurityAlert", securityAlertSchema);
