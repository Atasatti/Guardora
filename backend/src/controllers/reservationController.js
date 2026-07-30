import Reservation from "../models/reservation.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Bill from "../models/bill.js";
import Facility from "../models/facility.js";
import User from "../models/user.js";
import { recordAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notifications.js";
import { processReservationLifecycle } from "../services/reservationLifecycle.js";
import { sendCsv } from "../utils/downloads.js";

const canManageReservation = (req, reservation) =>
  String(reservation.residentId?._id || reservation.residentId) ===
    String(req.user._id) ||
  req.user.role === "ADMIN" ||
  (req.user.role === "MODERATOR" &&
    req.user.permissions?.includes("MANAGE_FACILITIES"));

const getAllReservations = catchAsyncErrors(async (req, res) => {
  const filter =
    req.user.role === "RESIDENT" ? { residentId: req.user._id } : {};
  const reservations = await Reservation.find(filter)
    .populate("facilityId", "name imageUrl openTime closeTime rules")
    .populate("residentId", "name email unitNumber profilePicture")
    .sort({ date: -1 });
  res.status(200).json(reservations);
});

const getReservationsByFacility = catchAsyncErrors(async (req, res) => {
  const { facilityId } = req.params;
  const reservations = await Reservation.find({
    facilityId,
    status: "CONFIRMED",
    endDate: { $gte: new Date() },
  }).select("date endDate durationInHours status");
  res.status(200).json(reservations);
});

const getReservationById = catchAsyncErrors(async (req, res, next) => {
  if (!canManageReservation(req, res.reservation)) {
    return next(
      new ErrorHandler("Not authorized to view this reservation", 403)
    );
  }
  res.json(res.reservation);
});

const createReservation = catchAsyncErrors(async (req, res, next) => {
  const { facilityId, residentId, date, durationInHours } = req.body;
  const resident =
    req.user.role === "RESIDENT" ? req.user._id : residentId || req.user._id;
  const start = new Date(date);
  const duration = Number(durationInHours);

  if (
    !facilityId ||
    Number.isNaN(start.getTime()) ||
    !Number.isFinite(duration) ||
    duration < 0.5 ||
    duration > 2
  ) {
    return next(
      new ErrorHandler(
        "Facility, valid date, and a duration between 0.5 and 2 hours are required",
        400
      )
    );
  }
  if (start <= new Date()) {
    return next(new ErrorHandler("Reservation must be in the future", 400));
  }

  const [facility, residentUser] = await Promise.all([
    Facility.findById(facilityId),
    User.findById(resident),
  ]);
  if (!facility) return next(new ErrorHandler("Facility not found", 404));
  if (
    !residentUser ||
    (residentUser.accountStatus && residentUser.accountStatus !== "ACTIVE")
  ) {
    return next(new ErrorHandler("Resident account is not active", 403));
  }
  if (
    residentUser.facilityRestrictionUntil &&
    residentUser.facilityRestrictionUntil > new Date()
  ) {
    return next(
      new ErrorHandler(
        `Facility booking is restricted until ${residentUser.facilityRestrictionUntil.toISOString()}`,
        403
      )
    );
  }
  // Legacy records created before account verification was introduced do not
  // have this field. Only an explicit false blocks the reservation.
  if (residentUser.isVerified === false) {
    return next(
      new ErrorHandler("Only verified residents can reserve facilities", 403)
    );
  }

  const endDate = new Date(start.getTime() + duration * 60 * 60 * 1000);
  const conflictingReservation = await Reservation.exists({
    facilityId,
    status: "CONFIRMED",
    date: { $lt: endDate },
    endDate: { $gt: start },
  });
  if (conflictingReservation) {
    return next(
      new ErrorHandler("The selected facility time is already reserved", 409)
    );
  }

  const reservation = new Reservation({
    facilityId,
    residentId: resident,
    date: start,
    endDate,
    durationInHours: duration,
  });
  await reservation.save();

  if (facility.isPaidService && Number(facility.pricePerHour) > 0) {
    const bill = await Bill.create({
      user: resident,
      title: `${facility.name} reservation`,
      description: `${duration} hour facility reservation`,
      dueDate: start,
      amount: Number(facility.pricePerHour) * duration,
      billType: "FACILITY",
      month: start.toISOString().slice(0, 7),
    });
    reservation.bill = bill._id;
    await reservation.save();
  }

  await createNotification({
    recipient: resident,
    type: "SYSTEM",
    title: "Facility reservation confirmed",
    message: `${facility.name} is reserved for ${start.toLocaleString()}.`,
    link: "/facilities",
    metadata: { reservationId: reservation._id },
  });
  await recordAudit({
    req,
    action: "FACILITY_RESERVED",
    targetModel: "Reservation",
    targetId: reservation._id,
    details: { facilityId, residentId: resident, date: start, duration },
  });

  await reservation.populate([
    { path: "facilityId", select: "name imageUrl" },
    { path: "residentId", select: "name email unitNumber profilePicture" },
  ]);
  res.status(201).json(reservation);
});

const updateReservation = catchAsyncErrors(async (req, res, next) => {
  if (!canManageReservation(req, res.reservation)) {
    return next(
      new ErrorHandler("Not authorized to modify this reservation", 403)
    );
  }
  if (res.reservation.status !== "CONFIRMED") {
    return next(new ErrorHandler("Only confirmed bookings can be modified", 409));
  }

  const start = req.body.date
    ? new Date(req.body.date)
    : res.reservation.date;
  const duration =
    req.body.durationInHours !== undefined
      ? Number(req.body.durationInHours)
      : res.reservation.durationInHours;
  if (
    Number.isNaN(start.getTime()) ||
    !Number.isFinite(duration) ||
    duration < 0.5 ||
    duration > 2
  ) {
    return next(new ErrorHandler("Invalid reservation date or duration", 400));
  }
  const endDate = new Date(start.getTime() + duration * 60 * 60 * 1000);
  const conflict = await Reservation.exists({
    _id: { $ne: res.reservation._id },
    facilityId: res.reservation.facilityId,
    status: "CONFIRMED",
    date: { $lt: endDate },
    endDate: { $gt: start },
  });
  if (conflict) {
    return next(
      new ErrorHandler("The selected facility time is already reserved", 409)
    );
  }

  res.reservation.date = start;
  res.reservation.endDate = endDate;
  res.reservation.durationInHours = duration;

  const updatedReservation = await res.reservation.save();
  await createNotification({
    recipient: updatedReservation.residentId,
    type: "SYSTEM",
    title: "Facility reservation updated",
    message: `Your booking was updated to ${start.toLocaleString()}.`,
    link: "/facilities",
    metadata: { reservationId: updatedReservation._id },
  });
  res.json(updatedReservation);
});

const deleteReservation = catchAsyncErrors(async (req, res, next) => {
  if (!canManageReservation(req, res.reservation)) {
    return next(
      new ErrorHandler("Not authorized to cancel this reservation", 403)
    );
  }
  if (res.reservation.status !== "CONFIRMED") {
    return next(new ErrorHandler("Reservation is already closed", 409));
  }
  const hoursUntilBooking =
    (res.reservation.date.getTime() - Date.now()) / (60 * 60 * 1000);
  if (req.user.role === "RESIDENT" && hoursUntilBooking < 12) {
    return next(
      new ErrorHandler(
        "Reservations can only be cancelled at least 12 hours in advance",
        409
      )
    );
  }

  res.reservation.status = "CANCELLED";
  res.reservation.cancelledAt = new Date();
  await res.reservation.save();
  await recordAudit({
    req,
    action: "FACILITY_RESERVATION_CANCELLED",
    targetModel: "Reservation",
    targetId: res.reservation._id,
  });
  res.json({ message: "Reservation cancelled", reservation: res.reservation });
});

const checkInReservation = catchAsyncErrors(async (req, res, next) => {
  if (res.reservation.status !== "CONFIRMED") {
    return next(new ErrorHandler("Reservation is not active", 409));
  }
  const earliest = new Date(res.reservation.date.getTime() - 30 * 60 * 1000);
  if (new Date() < earliest) {
    return next(new ErrorHandler("Check-in opens 30 minutes before booking", 409));
  }
  res.reservation.checkedInAt = new Date();
  await res.reservation.save();
  await recordAudit({
    req,
    action: "FACILITY_RESERVATION_CHECKED_IN",
    targetModel: "Reservation",
    targetId: res.reservation._id,
  });
  res.json(res.reservation);
});

const processReservations = catchAsyncErrors(async (req, res) => {
  res.json(await processReservationLifecycle());
});

const getReservationStats = catchAsyncErrors(async (req, res) => {
  const [byStatus, byFacility, usage] = await Promise.all([
    Reservation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Reservation.aggregate([
      { $group: { _id: "$facilityId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "facilities",
          localField: "_id",
          foreignField: "_id",
          as: "facility",
        },
      },
      { $unwind: { path: "$facility", preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, facilityName: "$facility.name" } },
    ]),
    Reservation.aggregate([
      { $match: { status: { $in: ["COMPLETED", "CONFIRMED"] } } },
      {
        $group: {
          _id: null,
          totalBookedHours: { $sum: "$durationInHours" },
          totalReservations: { $sum: 1 },
        },
      },
    ]),
  ]);
  res.json({
    byStatus,
    byFacility,
    usage: usage[0] || { totalBookedHours: 0, totalReservations: 0 },
  });
});

const exportReservationsCsv = catchAsyncErrors(async (req, res) => {
  const reservations = await Reservation.find()
    .populate("facilityId", "name")
    .populate("residentId", "name email unitNumber")
    .sort({ date: -1 });
  sendCsv(
    res,
    `guardora-reservations-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { key: "date", label: "Start" },
      { key: "end", label: "End" },
      { key: "facility", label: "Facility" },
      { key: "resident", label: "Resident" },
      { key: "unit", label: "Unit" },
      { key: "duration", label: "Duration (hours)" },
      { key: "status", label: "Status" },
      { key: "checkedIn", label: "Checked In" },
    ],
    reservations.map((reservation) => ({
      date: reservation.date,
      end: reservation.endDate,
      facility: reservation.facilityId?.name,
      resident: reservation.residentId?.name,
      unit: reservation.residentId?.unitNumber,
      duration: reservation.durationInHours,
      status: reservation.status,
      checkedIn: reservation.checkedInAt,
    }))
  );
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
  checkInReservation,
  processReservations,
  getReservationStats,
  exportReservationsCsv,
};
