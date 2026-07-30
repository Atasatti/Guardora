import mongoose from "mongoose";

const societyAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mapId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isSafe: {
      type: Boolean,
      default: true,
    },
    cctvIndex: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    riskReason: {
      type: String,
      default: null,
      trim: true,
    },
    riskExpiresAt: {
      type: Date,
      default: null,
    },
    center: {
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
    },
    polygon: [
      {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
      },
    ],
    connectedAreas: [
      {
        area: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SocietyArea",
          required: true,
        },
        distanceMeters: {
          type: Number,
          min: 1,
          required: true,
        },
      },
    ],
    safetyHistory: [
      {
        isSafe: Boolean,
        riskLevel: String,
        reason: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

societyAreaSchema.index({ isSafe: 1, riskLevel: 1 });
societyAreaSchema.index({ "connectedAreas.area": 1 });

export default mongoose.model("SocietyArea", societyAreaSchema);
