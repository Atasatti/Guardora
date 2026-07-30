import mongoose from "mongoose";

const paymentCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cardholderName: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ["STRIPE", "PAYPAL"],
      required: true,
    },
    providerPaymentMethodId: {
      type: String,
      required: true,
      select: false,
    },
    last4: {
      type: String,
      required: true,
      match: /^\d{4}$/,
    },
    expiryMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    expiryYear: {
      type: Number,
      required: true,
    },
    brand: {
      type: String,
      enum: ["VISA", "MASTERCARD", "PAYPAK", "AMEX", "OTHER"],
      required: true,
    },
    color: {
      type: String,
      enum: ["ORANGE", "PURPLE", "RED", "GREEN", "BLUE"],
      required: true,
    },
  },
  { timestamps: true }
);

paymentCardSchema.index({ user: 1, providerPaymentMethodId: 1 }, { unique: true });

export default mongoose.model("PaymentCard", paymentCardSchema);
