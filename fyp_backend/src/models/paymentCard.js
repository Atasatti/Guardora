import mongoose from "mongoose";

const paymentCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    creditCardNumber: {
      type: String,
      required: true,
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
    cvv: {
      type: Number,
      required: true,
      min: 100,
      max: 9999,
    },
    brand: {
      type: String,
      enum: ["VISA", "MASTERCARD", "PAYPAK"],
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

export default mongoose.model("PaymentCard", paymentCardSchema);
