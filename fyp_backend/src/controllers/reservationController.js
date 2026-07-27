import Reservation from "../models/reservation.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllReservations = catchAsyncErrors(async (req, res) => {
  const reservations = await Reservation.find();
  res.status(200).json(reservations);
});

const getReservationsByFacility = catchAsyncErrors(async (req, res) => {
  const { facilityId } = req.params;
  const reservations = await Reservation.find({ facilityId });
  res.status(200).json(reservations);
});

const getReservationById = catchAsyncErrors(async (req, res) => {
  res.json(res.reservation);
});

const createReservation = catchAsyncErrors(async (req, res) => {
  const { facilityId, residentId, date, durationInHours } = req.body;
  const reservation = new Reservation({
    facilityId,
    residentId,
    date,
    durationInHours,
  });
  await reservation.save();
  res.status(201).json(reservation);
});

const updateReservation = catchAsyncErrors(async (req, res) => {
  if (req.body.facilityId != null) {
    res.reservation.facilityId = req.body.facilityId;
  }
  if (req.body.residentId != null) {
    res.reservation.residentId = req.body.residentId;
  }
  if (req.body.date != null) {
    res.reservation.date = req.body.date;
  }
  if (req.body.durationInHours != null) {
    res.reservation.durationInHours = req.body.durationInHours;
  }

  const updatedReservation = await res.reservation.save();
  res.json(updatedReservation);
});

const deleteReservation = catchAsyncErrors(async (req, res) => {
  await res.reservation.deleteOne();
  res.json({ message: "Reservation deleted" });
});

// Middleware
const getReservation = catchAsyncErrors(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  if (reservation == null) {
    return next(new ErrorHandler("Reservation not found", 404));
  }
  res.reservation = reservation;
  next();
});

export {
  getReservation,
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationsByFacility,
};
