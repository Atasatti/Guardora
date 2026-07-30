import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Facility",
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
    durationInHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 2,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
      default: "CONFIRMED",
      index: true,
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    noShowMarkedAt: {
      type: Date,
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ facilityId: 1, date: 1, endDate: 1, status: 1 });
reservationSchema.index({ residentId: 1, date: -1 });

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
