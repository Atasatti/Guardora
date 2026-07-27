import SecurityAlert from "../models/securityAlert.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";

// 1. Create Alert (Called by Python)
export const createAlert = catchAsyncErrors(async (req, res, next) => {
  const { type, cameraName, snapshotBase64, details } = req.body;

  const alert = await SecurityAlert.create({
    type,
    cameraName,
    snapshotBase64,
    details,
    status: "NEW",
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

  const alert = await SecurityAlert.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  res.status(200).json({
    success: true,
    alert,
  });
});
