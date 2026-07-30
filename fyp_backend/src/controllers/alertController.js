import SecurityAlert from "../models/securityAlert.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { io } from "../server.js";
import { notifyRoles } from "../utils/notifications.js";
import { recordAudit } from "../utils/audit.js";
import BannedPerson from "../models/bannedPerson.js";

// 1. Create Alert (Called by Python)
export const createAlert = catchAsyncErrors(async (req, res, next) => {
  const { type, cameraName, snapshotBase64, details } = req.body;
  if (
    !["DANGEROUS_OBJECT", "UNSAFE_AREA", "BANNED_PERSON"].includes(type) ||
    !cameraName ||
    !snapshotBase64
  ) {
    return next(new ErrorHandler("Complete alert evidence is required", 400));
  }

  let bannedPerson = null;
  if (type === "BANNED_PERSON" && details?.name) {
    bannedPerson = await BannedPerson.findOne({
      name: { $regex: `^${String(details.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
  }

  const alert = await SecurityAlert.create({
    type,
    cameraName,
    snapshotBase64,
    details,
    bannedPerson: bannedPerson?._id || null,
    status: "NEW",
  });
  if (bannedPerson) {
    bannedPerson.lastSeenAt = alert.timestamp;
    bannedPerson.sightings.push({
      cameraName,
      confidence: details?.confidence ?? null,
      seenAt: alert.timestamp,
      alert: alert._id,
    });
    if (bannedPerson.sightings.length > 500) {
      bannedPerson.sightings = bannedPerson.sightings.slice(-500);
    }
    await bannedPerson.save();
  }
  io.emit("security_alert", alert);
  await notifyRoles(["ADMIN", "MODERATOR"], {
    type: "EMERGENCY",
    title: `${type} detected`,
    message: `${cameraName}: ${
      details?.object || details?.label || "Security event detected"
    }`,
    link: "/alerts",
    metadata: { alertId: alert._id, cameraName },
  });

  res.status(201).json({
    success: true,
    alert,
  });
});

// 2. Get All Alerts (For Frontend Dashboard)
export const getAlerts = catchAsyncErrors(async (req, res, next) => {
  // Sort by newest first
  const alerts = await SecurityAlert.find().sort({ timestamp: -1 }).limit(50);

  res.status(200).json({
    success: true,
    alerts,
  });
});

// 3. Update Alert Status (For "Mark as Reviewed")
export const updateAlertStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["NEW", "REVIEWED", "RESOLVED", "DISMISSED"].includes(status)) {
    return next(new ErrorHandler("Invalid alert status", 400));
  }

  const alert = await SecurityAlert.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!alert) return next(new ErrorHandler("Alert not found", 404));
  await recordAudit({
    req,
    action: "SECURITY_ALERT_UPDATED",
    targetModel: "SecurityAlert",
    targetId: alert._id,
    details: { status },
  });

  res.status(200).json({
    success: true,
    alert,
  });
});
