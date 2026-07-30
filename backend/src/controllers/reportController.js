import Report from "../models/report.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import { createNotification, notifyRoles } from "../utils/notifications.js";
import { sendCsv } from "../utils/downloads.js";

// 1. Create a new Report
const createReport = catchAsyncErrors(async (req, res, next) => {
  const { type, reason, targetId, latitude, longitude, locationLabel } =
    req.body;
  if (!type || !String(reason || "").trim()) {
    return next(new ErrorHandler("Report type and reason are required", 400));
  }

  const report = await Report.create({
    reporter: req.user._id,
    type,
    reason: String(reason).trim(),
    targetId: targetId || null,
    media: (req.files || []).map((file) => ({
      url: `uploads/${file.filename}`,
      type: file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE",
    })),
    location: {
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      label: locationLabel || null,
    },
    status: "PENDING",
  });

  await Promise.all([
    notifyRoles(["ADMIN", "MODERATOR"], {
      type: "SYSTEM",
      title: `New ${type.toLowerCase().replaceAll("_", " ")} report`,
      message: report.reason,
      link: "/reports",
      metadata: { reportId: report._id },
    }),
    recordAudit({
      req,
      action: "INCIDENT_REPORT_CREATED",
      targetModel: "Report",
      targetId: report._id,
      details: { type, mediaCount: report.media.length },
    }),
  ]);

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    report,
  });
});

// 2. Get All Reports (Admin) - Supports filtering by ?type=PERSON or ?status=PENDING
const getAllReports = catchAsyncErrors(async (req, res, next) => {
  const { type, status } = req.query;

  // Build query object dynamically
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const reports = await Report.find(query)
    .populate("reporter", "name email unitNumber profilePicture")
    .sort({ createdAt: -1 }); // Newest first

  res.status(200).json({
    success: true,
    count: reports.length,
    reports,
  });
});

// 3. Get My Reports (Resident) - For the mobile app users to see their history
const getMyReports = catchAsyncErrors(async (req, res, next) => {
  const { type, status } = req.query;

  const query = { reporter: req.user._id };
  if (type) query.type = type;
  if (status) query.status = status;

  const reports = await Report.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    reports,
  });
});

const exportReportsCsv = catchAsyncErrors(async (req, res) => {
  const reports = await Report.find()
    .populate("reporter", "name email unitNumber")
    .sort({ createdAt: -1 });
  sendCsv(
    res,
    `guardora-incidents-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { key: "created", label: "Created" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "reporter", label: "Reporter" },
      { key: "unit", label: "Unit" },
      { key: "reason", label: "Reason" },
      { key: "location", label: "Location" },
      { key: "response", label: "Admin Response" },
      { key: "resolved", label: "Resolved" },
    ],
    reports.map((report) => ({
      created: report.createdAt,
      type: report.type,
      status: report.status,
      reporter: report.reporter?.name,
      unit: report.reporter?.unitNumber,
      reason: report.reason,
      location: report.location?.label,
      response: report.adminResponse,
      resolved: report.resolvedAt,
    }))
  );
});

// 4. Update Report Status (Admin)
const updateReport = catchAsyncErrors(async (req, res, next) => {
  const { status, adminResponse } = req.body;

  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorHandler("Report not found", 404));
  }

  if (status) report.status = status;
  if (adminResponse) report.adminResponse = adminResponse;
  report.reviewedBy = req.user._id;
  if (["RESOLVED", "DISMISSED"].includes(report.status)) {
    report.resolvedAt = new Date();
  }

  await report.save();
  await Promise.all([
    createNotification({
      recipient: report.reporter,
      type: "SYSTEM",
      title: "Incident report updated",
      message: adminResponse || `Your report is now ${report.status}.`,
      link: "/reports",
      metadata: { reportId: report._id },
    }),
    recordAudit({
      req,
      action: "INCIDENT_REPORT_UPDATED",
      targetModel: "Report",
      targetId: report._id,
      details: { status: report.status },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Report status updated",
    report,
  });
});

// 5. Delete Report (Admin/User)
const deleteReport = catchAsyncErrors(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorHandler("Report not found", 404));
  }

  // Allow deletion if user is Admin OR if user is the reporter
  const isAdmin = req.user.role === "ADMIN" || req.user.role === "MODERATOR";
  const isOwner = report.reporter.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(new ErrorHandler("Not authorized to delete this report", 403));
  }

  await report.deleteOne();
  await recordAudit({
    req,
    action: "INCIDENT_REPORT_DELETED",
    targetModel: "Report",
    targetId: report._id,
  });

  res.status(200).json({
    success: true,
    message: "Report deleted successfully",
  });
});

export {
  createReport,
  getAllReports,
  getMyReports,
  exportReportsCsv,
  updateReport,
  deleteReport,
};
