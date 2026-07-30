import Emergency from "../models/emergency.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { io } from "../server.js";
import { recordAudit } from "../utils/audit.js";
import { notifyRoles } from "../utils/notifications.js";

// 1. Trigger SOS (Mobile App)
const triggerSOS = catchAsyncErrors(async (req, res, next) => {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return next(new ErrorHandler("A valid live location is required", 400));
  }

  // Check if active exists
  const activeEmergency = await Emergency.findOne({
    resident: req.user._id,
    status: "ACTIVE",
  });

  if (activeEmergency) {
    return res.status(200).json({
      success: true,
      message: "SOS is already active",
      emergency: activeEmergency,
    });
  }

  const emergency = await Emergency.create({
    resident: req.user._id,
    location: { latitude, longitude },
    locationHistory: [{ latitude, longitude }],
    status: "ACTIVE",
  });

  io.emit("emergency_triggered", emergency);
  await Promise.all([
    notifyRoles(["ADMIN", "MODERATOR"], {
      type: "EMERGENCY",
      title: `SOS from ${req.user.name}`,
      message: `Live location: ${latitude}, ${longitude}`,
      link: "/alerts",
      metadata: { emergencyId: emergency._id, latitude, longitude },
    }),
    recordAudit({
      req,
      action: "SOS_TRIGGERED",
      targetModel: "Emergency",
      targetId: emergency._id,
      details: { latitude, longitude },
    }),
  ]);

  res.status(201).json({
    success: true,
    message: "Emergency alert triggered!",
    emergency,
  });
});

const updateEmergencyLocation = catchAsyncErrors(async (req, res, next) => {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return next(new ErrorHandler("A valid live location is required", 400));
  }
  const emergency = await Emergency.findOne({
    resident: req.user._id,
    status: "ACTIVE",
  });
  if (!emergency) return next(new ErrorHandler("No active SOS found", 404));
  emergency.location = { latitude, longitude };
  emergency.locationHistory.push({ latitude, longitude });
  if (emergency.locationHistory.length > 500) {
    emergency.locationHistory = emergency.locationHistory.slice(-500);
  }
  await emergency.save();
  io.emit("emergency_location_updated", {
    emergencyId: emergency._id,
    resident: emergency.resident,
    location: emergency.location,
    updatedAt: new Date(),
  });
  res.json({ success: true, emergency });
});

// 2. Cancel SOS (Resident - NEW)
const cancelSOS = catchAsyncErrors(async (req, res, next) => {
  const emergency = await Emergency.findOne({
    resident: req.user._id,
    status: "ACTIVE",
  });

  if (!emergency) {
    return next(new ErrorHandler("No active emergency found to cancel", 404));
  }

  emergency.status = "RESOLVED"; // User cancelled it
  emergency.resolvedBy = req.user._id; // Resolved by self
  emergency.resolvedAt = Date.now();
  emergency.adminNotes = "Cancelled by resident";

  await emergency.save();

  io.emit("emergency_resolved", emergency);
  await recordAudit({
    req,
    action: "SOS_CANCELLED",
    targetModel: "Emergency",
    targetId: emergency._id,
  });

  res.status(200).json({
    success: true,
    message: "SOS Alert Cancelled",
  });
});

// 3. Get Active (Admin)
const getActiveEmergencies = catchAsyncErrors(async (req, res, next) => {
  const emergencies = await Emergency.find({ status: "ACTIVE" })
    .populate("resident", "name unitNumber phoneNumber profilePicture")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, emergencies });
});

// 4. Resolve (Admin)
const resolveEmergency = catchAsyncErrors(async (req, res, next) => {
  const { status, adminNotes } = req.body;
  let emergency = await Emergency.findById(req.params.id);

  if (!emergency) return next(new ErrorHandler("Not found", 404));

  emergency.status = status || "RESOLVED";
  emergency.adminNotes = adminNotes;
  emergency.resolvedBy = req.user._id;
  emergency.resolvedAt = Date.now();

  await emergency.save();
  io.emit("emergency_resolved", emergency);
  await recordAudit({
    req,
    action: "SOS_RESOLVED",
    targetModel: "Emergency",
    targetId: emergency._id,
    details: { status: emergency.status },
  });

  res.status(200).json({ success: true, emergency });
});

export {
  triggerSOS,
  updateEmergencyLocation,
  cancelSOS,
  getActiveEmergencies,
  resolveEmergency,
};
