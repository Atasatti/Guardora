import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Dynamic Reference: Can be a Product OR a Service
    targetItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel", // Tells Mongoose which model to look at
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["Product", "Service"],
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "EXPIRED"],
      default: "PENDING",
    },
    durationDays: {
      type: Number,
      required: true, // e.g., 7, 14, 30
    },
    expiresAt: {
      type: Date,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    // Optional: Admin note for rejection
    adminNote: String,
  },
  { timestamps: true }
);

// Index for faster feed injection queries
adSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model("Ad", adSchema);
