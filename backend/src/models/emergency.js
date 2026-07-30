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
    locationHistory: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
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

emergencySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Emergency", emergencySchema);
