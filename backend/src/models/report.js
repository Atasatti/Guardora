import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "SOCIAL_POST",
        "MARKET_PRODUCT",
        "PERSON",
        "INCIDENT",
        "DANGEROUS_AREA",
        "OTHER",
      ],
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Please provide a reason or description for the report"],
      trim: true,
      maxLength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      default: "PENDING",
    },
    // Optional: Admin can add a note when resolving
    adminResponse: {
      type: String,
    },
    targetId: {
      type: String,
      default: null,
      trim: true,
    },
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO"],
          required: true,
        },
      },
    ],
    location: {
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
      label: { type: String, default: null, trim: true },
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, type: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
