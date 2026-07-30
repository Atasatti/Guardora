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
      enum: ["NEW", "REVIEWED", "RESOLVED", "DISMISSED"],
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
      type: String, // Stored inline for the current alert snapshot workflow
      required: true,
    },
    details: {
      object: String, // e.g. "Gun", "Person"
      confidence: Number, // e.g. 0.85
      name: String,
    },
    bannedPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BannedPerson",
      default: null,
    },
  },
  { timestamps: true }
);

securityAlertSchema.index({ bannedPerson: 1, timestamp: -1 });

export default mongoose.model("SecurityAlert", securityAlertSchema);
