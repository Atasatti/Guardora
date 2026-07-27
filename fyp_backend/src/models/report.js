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
      enum: ["SOCIAL_POST", "MARKET_PRODUCT", "PERSON", "OTHER"],
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
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
