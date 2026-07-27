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
    type: {
      type: String,
      enum: ["GUEST", "SERVICE", "DELIVERY", "RIDE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
    photoUrl: { type: String },
    entryCode: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
