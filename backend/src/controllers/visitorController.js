import Visitor from "../models/visitor.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import { createNotification, notifyRoles } from "../utils/notifications.js";

const canManageVisitor = (req, visitor) =>
  String(visitor.host?._id || visitor.host) === String(req.user._id) ||
  req.user.role === "ADMIN" ||
  (req.user.role === "MODERATOR" &&
    req.user.permissions?.includes("MANAGE_VISITORS"));

const isSecurityStaff = (req) =>
  req.user.role === "ADMIN" ||
  (req.user.role === "MODERATOR" &&
    req.user.permissions?.includes("MANAGE_VISITORS"));

const getAllVisitors = catchAsyncErrors(async (req, res) => {
  const visitors = await Visitor.find()
    .populate("host", "name unitNumber phoneNumber")
    .sort({ createdAt: -1 });
  res.status(200).json(visitors);
});

const getResidentVisitors = catchAsyncErrors(async (req, res) => {
  const visitors = await Visitor.find({ host: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json(visitors);
});

const getVisitorById = catchAsyncErrors(async (req, res, next) => {
  if (!canManageVisitor(req, res.visitor)) {
    return next(new ErrorHandler("Not authorized to view this visitor", 403));
  }
  res.json(res.visitor);
});

const createVisitor = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    phoneNumber,
    visitDate,
    type,
    photoUrl,
    purpose,
    validUntil,
  } = req.body;
  if (!name || !phoneNumber || !visitDate || !type) {
    return next(new ErrorHandler("Visitor details are incomplete", 400));
  }

  const visitStartsAt = new Date(visitDate);
  const expiresAt = validUntil
    ? new Date(validUntil)
    : new Date(visitStartsAt.getTime() + 8 * 60 * 60 * 1000);
  if (
    Number.isNaN(visitStartsAt.getTime()) ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= visitStartsAt
  ) {
    return next(new ErrorHandler("Invalid visitor pass validity window", 400));
  }

  let { entryCode } = req.body;
  if (!entryCode) {
    do {
      entryCode = Math.floor(100000 + Math.random() * 900000).toString();
    } while (await Visitor.exists({ entryCode }));
  }

  const visitor = new Visitor({
    name,
    phoneNumber,
    visitDate: visitStartsAt,
    validUntil: expiresAt,
    purpose,
    type,
    status: "ACTIVE",
    photoUrl,
    entryCode,
    host: req.user._id,
  });

  const newVisitor = await visitor.save();
  res.status(201).json(newVisitor);
});

const updateVisitor = catchAsyncErrors(async (req, res) => {
  if (!canManageVisitor(req, res.visitor)) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to update this visitor" });
  }

  if (
    req.user.role === "RESIDENT" &&
    !["ACTIVE", "EXPIRED"].includes(res.visitor.status)
  ) {
    return res.status(409).json({
      success: false,
      message: "A checked-in visitor pass can only be updated by security",
    });
  }

  const fields = [
    "name",
    "phoneNumber",
    "visitDate",
    "type",
    "photoUrl",
    "purpose",
    "validUntil",
  ];

  fields.forEach((field) => {
    if (req.body[field] != null) {
      res.visitor[field] = req.body[field];
    }
  });

  const updatedVisitor = await res.visitor.save();
  res.json(updatedVisitor);
});

const deleteVisitor = catchAsyncErrors(async (req, res) => {
  if (!canManageVisitor(req, res.visitor)) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to delete this visitor" });
  }

  if (res.visitor.status === "CHECKED_IN") {
    return res.status(409).json({
      success: false,
      message: "Check the visitor out before deleting the pass",
    });
  }

  await res.visitor.deleteOne();
  res.json({ message: "Visitor deleted" });
});

const verifyVisitorPass = catchAsyncErrors(async (req, res, next) => {
  if (!isSecurityStaff(req)) {
    return next(new ErrorHandler("Security access required", 403));
  }

  const visitor = await Visitor.findOne({
    entryCode: req.params.entryCode,
  }).populate("host", "name unitNumber phoneNumber");
  if (!visitor) return next(new ErrorHandler("Visitor pass not found", 404));

  if (visitor.validUntil <= new Date() && visitor.status === "ACTIVE") {
    visitor.status = "EXPIRED";
    await visitor.save();
  }

  res.status(200).json({
    success: true,
    valid:
      visitor.status === "ACTIVE" &&
      !visitor.isSuspicious &&
      visitor.validUntil > new Date(),
    visitor,
  });
});

const checkInVisitor = catchAsyncErrors(async (req, res, next) => {
  if (!isSecurityStaff(req)) {
    return next(new ErrorHandler("Security access required", 403));
  }

  const visitor = res.visitor;
  if (visitor.isSuspicious || visitor.status === "DENIED") {
    return next(new ErrorHandler("Entry denied: visitor is flagged", 403));
  }
  if (visitor.validUntil <= new Date()) {
    visitor.status = "EXPIRED";
    await visitor.save();
    return next(new ErrorHandler("Visitor pass has expired", 410));
  }
  if (visitor.status !== "ACTIVE") {
    return next(
      new ErrorHandler(`Visitor pass is already ${visitor.status}`, 409)
    );
  }

  visitor.status = "CHECKED_IN";
  visitor.checkInAt = new Date();
  await visitor.save();
  await createNotification({
    recipient: visitor.host,
    type: "VISITOR",
    title: "Visitor checked in",
    message: `${visitor.name} has entered the society.`,
    metadata: { visitorId: visitor._id },
  });
  await recordAudit({
    req,
    action: "VISITOR_CHECKED_IN",
    targetModel: "Visitor",
    targetId: visitor._id,
  });

  res.status(200).json({ success: true, visitor });
});

const checkOutVisitor = catchAsyncErrors(async (req, res, next) => {
  if (!isSecurityStaff(req)) {
    return next(new ErrorHandler("Security access required", 403));
  }
  const visitor = res.visitor;
  if (visitor.status !== "CHECKED_IN") {
    return next(new ErrorHandler("Visitor is not currently checked in", 409));
  }

  visitor.status = "CHECKED_OUT";
  visitor.checkOutAt = new Date();
  await visitor.save();
  await createNotification({
    recipient: visitor.host,
    type: "VISITOR",
    title: "Visitor checked out",
    message: `${visitor.name} has left the society.`,
    metadata: { visitorId: visitor._id },
  });
  await recordAudit({
    req,
    action: "VISITOR_CHECKED_OUT",
    targetModel: "Visitor",
    targetId: visitor._id,
  });

  res.status(200).json({ success: true, visitor });
});

const flagVisitor = catchAsyncErrors(async (req, res, next) => {
  if (!isSecurityStaff(req) && String(res.visitor.host) !== String(req.user._id)) {
    return next(new ErrorHandler("Not authorized to flag this visitor", 403));
  }

  const reason = String(req.body.reason || "").trim();
  if (!reason) return next(new ErrorHandler("Flag reason is required", 400));

  res.visitor.isSuspicious = true;
  res.visitor.flagReason = reason;
  res.visitor.flaggedBy = req.user._id;
  if (res.visitor.status !== "CHECKED_OUT") {
    res.visitor.status = "DENIED";
  }
  await res.visitor.save();

  await notifyRoles(["ADMIN", "MODERATOR"], {
    type: "VISITOR",
    title: "Suspicious visitor flagged",
    message: `${res.visitor.name} was flagged: ${reason}`,
    link: "/visitors",
    metadata: { visitorId: res.visitor._id },
  });
  await recordAudit({
    req,
    action: "VISITOR_FLAGGED",
    targetModel: "Visitor",
    targetId: res.visitor._id,
    details: { reason },
  });

  res.status(200).json({ success: true, visitor: res.visitor });
});

const getVisitor = catchAsyncErrors(async (req, res, next) => {
  const visitor = await Visitor.findById(req.params.id);
  if (visitor == null) {
    return next(new ErrorHandler("Visitor not found", 404));
  }
  res.visitor = visitor;
  next();
});

export {
  getVisitor,
  getAllVisitors,
  getResidentVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  verifyVisitorPass,
  checkInVisitor,
  checkOutVisitor,
  flagVisitor,
};
