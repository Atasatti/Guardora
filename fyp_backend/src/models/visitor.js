import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    visitDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    purpose: { type: String, default: "Visit", trim: true },
    type: {
      type: String,
      enum: ["GUEST", "SERVICE", "DELIVERY", "RIDE"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "CHECKED_IN",
        "CHECKED_OUT",
        "EXPIRED",
        "DENIED",
      ],
      default: "ACTIVE",
    },
    photoUrl: { type: String },
    entryCode: { type: String, unique: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    isSuspicious: { type: Boolean, default: false, index: true },
    flagReason: { type: String, default: null },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

visitorSchema.index({ host: 1, createdAt: -1 });
visitorSchema.index({ status: 1, validUntil: 1 });

export default mongoose.model("Visitor", visitorSchema);
