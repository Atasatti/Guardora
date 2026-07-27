import Report from "../models/report.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// 1. Create a new Report
const createReport = catchAsyncErrors(async (req, res, next) => {
  const { type, reason } = req.body;

  const report = await Report.create({
    reporter: req.user._id,
    type,
    reason,
    status: "PENDING",
  });

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

// 4. Update Report Status (Admin)
const updateReport = catchAsyncErrors(async (req, res, next) => {
  const { status, adminResponse } = req.body;

  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorHandler("Report not found", 404));
  }

  if (status) report.status = status;
  if (adminResponse) report.adminResponse = adminResponse;

  await report.save();

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

  res.status(200).json({
    success: true,
    message: "Report deleted successfully",
  });
});

export {
  createReport,
  getAllReports,
  getMyReports,
  updateReport,
  deleteReport,
};
