import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    lateFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    isCleared: {
      type: Boolean,
      default: false,
    },
    clearedAt: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "UNPAID",
    },
    receiptNumber: {
      type: String,
      default: null,
      trim: true,
    },
    billType: {
      type: String,
      enum: ["MAINTENANCE", "UTILITY", "FACILITY", "PENALTY", "OTHER"],
      default: "OTHER",
    },
    month: {
      type: String, // e.g., "2024-01" for January 2024
      required: true,
    },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, dueDate: -1 });
billSchema.index({ isCleared: 1, dueDate: 1 });
billSchema.index({ paymentStatus: 1, dueDate: 1 });

billSchema.pre("validate", function setOriginalAmount() {
  if (this.originalAmount == null && Number.isFinite(this.amount)) {
    this.originalAmount = this.amount;
  }
});

export default mongoose.model("Bill", billSchema);
