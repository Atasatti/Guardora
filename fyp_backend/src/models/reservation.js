import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    facilityId: {
      type: String,
      required: true,
      ref: "Facility",
    },
    residentId: {
      type: String,
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
    },
  },
  { timestamps: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
