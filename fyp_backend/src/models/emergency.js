import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "FALSE_ALARM"],
      default: "ACTIVE",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Emergency", emergencySchema);
