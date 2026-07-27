import Emergency from "../models/emergency.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// 1. Trigger SOS (Mobile App)
const triggerSOS = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude } = req.body;

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
    location: { latitude: latitude || 0, longitude: longitude || 0 },
    status: "ACTIVE",
  });

  // TODO: Send Socket.IO/Firebase alert to Admin Panel here

  res.status(201).json({
    success: true,
    message: "Emergency alert triggered!",
    emergency,
  });
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

  // TODO: Emit event to Admin Panel to remove red alert

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

  res.status(200).json({ success: true, emergency });
});

export { triggerSOS, cancelSOS, getActiveEmergencies, resolveEmergency };
