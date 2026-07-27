import MaintenanceTicket from "../models/maintenanceTicket.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// GET all tickets
const getAllTickets = catchAsyncErrors(async (req, res) => {
  const tickets = await MaintenanceTicket.find()
    .populate("requester", "name profilePicture unitNumber")
    .sort({ createdAt: -1 });
  res.status(200).json(tickets);
});

const getUserTickets = catchAsyncErrors(async (req, res) => {
  const userId = req.user.id;
  const tickets = await MaintenanceTicket.find({ requester: userId });
  res.status(200).json(tickets);
});

// GET one ticket
const getTicketById = catchAsyncErrors(async (req, res) => {
  res.json(res.ticket);
});

// POST create ticket
const createTicket = catchAsyncErrors(async (req, res) => {
  const { title, description, status, type, createdAt, closedAt } = req.body;
  const requesterId = req.user.id;

  const ticket = new MaintenanceTicket({
    title,
    description,
    status,
    type,
    requester: requesterId,
    createdAt: createdAt || new Date(),
    closedAt: closedAt || null,
  });

  const newTicket = await ticket.save();
  res.status(201).json(newTicket);
});

// PATCH update ticket
const updateTicket = catchAsyncErrors(async (req, res) => {
  const { title, description, status, type, closedAt } = req.body;

  if (title != null) res.ticket.title = title;
  if (description != null) res.ticket.description = description;
  if (status != null) res.ticket.status = status;
  if (type != null) res.ticket.type = type;
  if (closedAt !== undefined) res.ticket.closedAt = closedAt;

  const updatedTicket = await res.ticket.save();
  res.json(updatedTicket);
});

// DELETE a ticket
const deleteTicket = catchAsyncErrors(async (req, res) => {
  await res.ticket.deleteOne();
  res.json({ message: "Maintenance ticket deleted" });
});

// Middleware to get a ticket by ID
const getTicket = catchAsyncErrors(async (req, res, next) => {
  const ticket = await MaintenanceTicket.findById(req.params.id).populate(
    "requester",
    "name profilePicture unitNumber"
  );
  if (ticket == null) {
    return next(new ErrorHandler("Maintenance ticket not found", 404));
  }
  res.ticket = ticket;
  next();
});

export {
  getTicket,
  getAllTickets,
  getUserTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
};
