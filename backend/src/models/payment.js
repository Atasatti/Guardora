import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "PKR",
      uppercase: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ["STRIPE", "PAYPAL", "BANK_TRANSFER", "CASH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    externalReference: {
      type: String,
      default: null,
      trim: true,
    },
    receiptNumber: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ bill: 1, status: 1 });

export default mongoose.model("Payment", paymentSchema);
