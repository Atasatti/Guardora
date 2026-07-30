import MaintenanceTicket from "../models/maintenanceTicket.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import { createNotification, notifyRoles } from "../utils/notifications.js";
import { sendCsv } from "../utils/downloads.js";
import {
  removeUploadFile,
  storedUploadPath,
} from "../config/uploads.js";

const isMaintenanceManager = (user) =>
  user.role === "ADMIN" ||
  (user.role === "MODERATOR" &&
    user.permissions?.includes("MANAGE_MAINTENANCE"));

const ownsTicket = (user, ticket) =>
  String(ticket.requester?._id || ticket.requester) === String(user._id);

const populateTicket = (query) =>
  query
    .populate("requester", "name email profilePicture unitNumber")
    .populate("assignedTo", "name email role profilePicture");

const getAllTickets = catchAsyncErrors(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  const tickets = await populateTicket(
    MaintenanceTicket.find(filter).sort({ createdAt: -1 })
  );
  res.status(200).json(tickets);
});

const getUserTickets = catchAsyncErrors(async (req, res) => {
  const tickets = await populateTicket(
    MaintenanceTicket.find({ requester: req.user._id }).sort({
      createdAt: -1,
    })
  );
  res.status(200).json(tickets);
});

const exportMaintenanceCsv = catchAsyncErrors(async (req, res) => {
  const tickets = await populateTicket(
    MaintenanceTicket.find().sort({ createdAt: -1 })
  );
  sendCsv(
    res,
    `guardora-maintenance-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { key: "created", label: "Created" },
      { key: "title", label: "Ticket" },
      { key: "type", label: "Type" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "resident", label: "Resident" },
      { key: "unit", label: "Unit" },
      { key: "assignee", label: "Assigned To" },
      { key: "closed", label: "Closed" },
      { key: "rating", label: "Rating" },
    ],
    tickets.map((ticket) => ({
      created: ticket.createdAt,
      title: ticket.title,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      resident: ticket.requester?.name,
      unit: ticket.requester?.unitNumber,
      assignee: ticket.assignedTo?.name,
      closed: ticket.closedAt,
      rating: ticket.feedback?.rating,
    }))
  );
});

const getTicketById = catchAsyncErrors(async (req, res, next) => {
  if (!isMaintenanceManager(req.user) && !ownsTicket(req.user, res.ticket)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  res.json(res.ticket);
});

const createTicket = catchAsyncErrors(async (req, res, next) => {
  const { title, description, type, priority, attachments } = req.body;
  if (!title?.trim() || !description?.trim() || !type) {
    for (const file of req.files || []) removeUploadFile(file.filename);
    return next(
      new ErrorHandler("Title, description, and ticket type are required", 400)
    );
  }

  const ticket = await MaintenanceTicket.create({
    title: title.trim(),
    description: description.trim(),
    type,
    priority: priority || "MEDIUM",
    attachments: req.files?.length
      ? req.files.map((file) => storedUploadPath(file.filename)).slice(0, 5)
      : Array.isArray(attachments)
        ? attachments.slice(0, 5)
        : [],
    requester: req.user._id,
    status: "PENDING",
    statusHistory: [{ status: "PENDING", changedBy: req.user._id }],
  });
  await Promise.all([
    notifyRoles(["ADMIN", "MODERATOR"], {
      type: "MAINTENANCE",
      title: `New ${ticket.priority.toLowerCase()} maintenance request`,
      message: ticket.title,
      link: "/maintenance",
      metadata: { ticketId: ticket._id },
    }),
    recordAudit({
      req,
      action: "MAINTENANCE_TICKET_CREATED",
      targetModel: "MaintenanceTicket",
      targetId: ticket._id,
      details: { type, priority: ticket.priority },
    }),
  ]);
  res.status(201).json(ticket);
});

const assignTicket = catchAsyncErrors(async (req, res, next) => {
  const assignee = await User.findById(req.body.assignedTo);
  if (
    !assignee ||
    (assignee.accountStatus && assignee.accountStatus !== "ACTIVE")
  ) {
    return next(new ErrorHandler("Active assignee not found", 404));
  }

  res.ticket.assignedTo = assignee._id;
  res.ticket.assignedAt = new Date();
  res.ticket.status = "ASSIGNED";
  res.ticket.expectedResolutionAt = req.body.expectedResolutionAt || null;
  res.ticket.statusHistory.push({
    status: "ASSIGNED",
    changedBy: req.user._id,
    note: req.body.note || null,
  });
  await res.ticket.save();
  await Promise.all([
    createNotification({
      recipient: assignee._id,
      type: "MAINTENANCE",
      title: "Maintenance request assigned",
      message: res.ticket.title,
      link: "/maintenance",
      metadata: { ticketId: res.ticket._id },
    }),
    createNotification({
      recipient: res.ticket.requester,
      type: "MAINTENANCE",
      title: "Your maintenance request was assigned",
      message: `${assignee.name} has been assigned to ${res.ticket.title}.`,
      link: "/maintenance",
      metadata: { ticketId: res.ticket._id },
    }),
    recordAudit({
      req,
      action: "MAINTENANCE_TICKET_ASSIGNED",
      targetModel: "MaintenanceTicket",
      targetId: res.ticket._id,
      details: { assignedTo: assignee._id },
    }),
  ]);
  res.json(res.ticket);
});

const updateTicket = catchAsyncErrors(async (req, res, next) => {
  const { title, description, status, type, priority, expectedResolutionAt } =
    req.body;
  const allowedStatuses = [
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  if (status && !allowedStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid maintenance status", 400));
  }

  if (title != null) res.ticket.title = String(title).trim();
  if (description != null) res.ticket.description = String(description).trim();
  if (type != null) res.ticket.type = type;
  if (priority != null) res.ticket.priority = priority;
  if (expectedResolutionAt !== undefined) {
    res.ticket.expectedResolutionAt = expectedResolutionAt || null;
  }
  if (status != null && status !== res.ticket.status) {
    res.ticket.status = status;
    res.ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: req.body.note || null,
    });
    if (status === "COMPLETED") res.ticket.closedAt = new Date();
    if (status !== "COMPLETED") res.ticket.closedAt = null;
  }

  const updatedTicket = await res.ticket.save();
  await Promise.all([
    createNotification({
      recipient: updatedTicket.requester,
      type: "MAINTENANCE",
      title: "Maintenance request updated",
      message: `${updatedTicket.title} is now ${updatedTicket.status
        .toLowerCase()
        .replaceAll("_", " ")}.`,
      link: "/maintenance",
      metadata: { ticketId: updatedTicket._id },
    }),
    recordAudit({
      req,
      action: "MAINTENANCE_TICKET_UPDATED",
      targetModel: "MaintenanceTicket",
      targetId: updatedTicket._id,
      details: { status: updatedTicket.status, priority: updatedTicket.priority },
    }),
  ]);
  res.json(updatedTicket);
});

const submitFeedback = catchAsyncErrors(async (req, res, next) => {
  if (!ownsTicket(req.user, res.ticket)) {
    return next(new ErrorHandler("Only the requester can submit feedback", 403));
  }
  if (res.ticket.status !== "COMPLETED") {
    return next(
      new ErrorHandler("Feedback is available after ticket completion", 409)
    );
  }
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return next(new ErrorHandler("Rating must be from 1 to 5", 400));
  }
  res.ticket.feedback = {
    rating,
    comment: req.body.comment || null,
    submittedAt: new Date(),
  };
  await res.ticket.save();
  await recordAudit({
    req,
    action: "MAINTENANCE_FEEDBACK_SUBMITTED",
    targetModel: "MaintenanceTicket",
    targetId: res.ticket._id,
    details: { rating },
  });
  res.json(res.ticket);
});

const getMaintenanceStats = catchAsyncErrors(async (req, res) => {
  const [byStatus, byType, performance] = await Promise.all([
    MaintenanceTicket.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    MaintenanceTicket.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    MaintenanceTicket.aggregate([
      { $match: { status: "COMPLETED", closedAt: { $ne: null } } },
      {
        $project: {
          resolutionHours: {
            $divide: [{ $subtract: ["$closedAt", "$createdAt"] }, 3600000],
          },
          rating: "$feedback.rating",
        },
      },
      {
        $group: {
          _id: null,
          averageResolutionHours: { $avg: "$resolutionHours" },
          averageRating: { $avg: "$rating" },
          completed: { $sum: 1 },
        },
      },
    ]),
  ]);
  res.json({
    byStatus,
    byType,
    performance: performance[0] || {
      averageResolutionHours: 0,
      averageRating: 0,
      completed: 0,
    },
  });
});

const deleteTicket = catchAsyncErrors(async (req, res) => {
  for (const attachment of res.ticket.attachments || []) {
    removeUploadFile(attachment);
  }
  await res.ticket.deleteOne();
  await recordAudit({
    req,
    action: "MAINTENANCE_TICKET_DELETED",
    targetModel: "MaintenanceTicket",
    targetId: res.ticket._id,
  });
  res.json({ message: "Maintenance ticket deleted" });
});

const getTicket = catchAsyncErrors(async (req, res, next) => {
  const ticket = await populateTicket(MaintenanceTicket.findById(req.params.id));
  if (!ticket) {
    return next(new ErrorHandler("Maintenance ticket not found", 404));
  }
  res.ticket = ticket;
  next();
});

export {
  getTicket,
  getAllTickets,
  getUserTickets,
  exportMaintenanceCsv,
  getTicketById,
  createTicket,
  assignTicket,
  updateTicket,
  submitFeedback,
  getMaintenanceStats,
  deleteTicket,
};
