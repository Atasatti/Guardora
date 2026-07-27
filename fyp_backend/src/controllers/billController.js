import Bill from "../models/bill.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Get all bills (ADMIN ONLY - for all users)
const getAllBills = catchAsyncErrors(async (req, res) => {
  const { page = 1, limit = 10, isCleared, billType } = req.query;

  const filter = {};
  if (isCleared !== undefined) filter.isCleared = isCleared === "true";
  if (billType) filter.billType = billType;

  const bills = await Bill.find(filter)
    .populate("user", "name email unitNumber profilePicture")
    .sort({ dueDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Bill.countDocuments(filter);

  res.status(200).json({
    bills,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// Get bills for authenticated user
const getUserBills = catchAsyncErrors(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, isCleared, billType } = req.query;

  const filter = { user: userId };
  if (isCleared !== undefined) filter.isCleared = isCleared === "true";
  if (billType) filter.billType = billType;

  const bills = await Bill.find(filter)
    .sort({ dueDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Bill.countDocuments(filter);

  res.status(200).json({
    bills,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// Get bill by ID (user can only access their own, admin can access any)
const getBillById = catchAsyncErrors(async (req, res) => {
  const bill = res.bill;

  // Check if user owns the bill or is admin
  if (req.user.role !== "ADMIN" && bill.user.toString() !== req.user.id) {
    return next(new ErrorHandler("Access denied", 403));
  }

  await bill.populate("user", "name email unitNumber profilePicture");
  res.json(bill);
});

// Create bill for specific user (ADMIN ONLY)
const createBill = catchAsyncErrors(async (req, res) => {
  const { userId, title, description, dueDate, amount, billType, month } =
    req.body;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const bill = new Bill({
    user: userId,
    title,
    description,
    dueDate,
    amount,
    billType: billType || "OTHER",
    month: month || new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  const newBill = await bill.save();
  await newBill.populate("user", "name email unitNumber profilePicture");
  res.status(201).json(newBill);
});

// Create bills for all users (ADMIN ONLY - bulk operation)
const createBulkBills = catchAsyncErrors(async (req, res) => {
  const { title, description, dueDate, amount, billType, month } = req.body;

  // Get all residents
  const residents = await User.find({ role: "RESIDENT" });

  const bills = residents.map((resident) => ({
    user: resident._id,
    title,
    description,
    dueDate,
    amount,
    billType: billType || "OTHER",
    month: month || new Date().toISOString().slice(0, 7),
  }));

  const createdBills = await Bill.insertMany(bills);
  res.status(201).json({
    message: `Created ${createdBills.length} bills successfully`,
    bills: createdBills,
  });
});

// Update bill (user can only update their own isCleared, admin can update all)
const updateBill = catchAsyncErrors(async (req, res, next) => {
  const { title, description, dueDate, amount, isCleared, billType } = req.body;
  const bill = res.bill;

  // Check permissions
  if (req.user.role !== "ADMIN" && bill.user.toString() !== req.user.id) {
    return next(new ErrorHandler("Access denied", 403));
  }

  // Users can only update isCleared field
  if (req.user.role !== "ADMIN") {
    if (isCleared !== undefined) {
      bill.isCleared = isCleared;
      if (isCleared && !bill.clearedAt) {
        bill.clearedAt = new Date();
      }
    }
  } else {
    // Admin can update all fields
    if (title != null) bill.title = title;
    if (description != null) bill.description = description;
    if (dueDate != null) bill.dueDate = dueDate;
    if (amount != null) bill.amount = amount;
    if (isCleared != null) {
      bill.isCleared = isCleared;
      if (isCleared && !bill.clearedAt) {
        bill.clearedAt = new Date();
      } else if (!isCleared) {
        bill.clearedAt = null;
      }
    }
    if (billType != null) bill.billType = billType;
  }

  const updatedBill = await bill.save();
  await updatedBill.populate("user", "name email unitNumber profilePicture");
  res.json(updatedBill);
});

// Delete bill (ADMIN ONLY)
const deleteBill = catchAsyncErrors(async (req, res) => {
  await res.bill.deleteOne();
  res.json({ message: "Bill deleted" });
});

// Get billing statistics (ADMIN ONLY)
const getBillingStats = catchAsyncErrors(async (req, res) => {
  const totalBills = await Bill.countDocuments();
  const pendingBills = await Bill.countDocuments({ isCleared: false });
  const clearedBills = await Bill.countDocuments({ isCleared: true });

  const totalAmount = await Bill.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const pendingAmount = await Bill.aggregate([
    { $match: { isCleared: false } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  res.status(200).json({
    totalBills,
    pendingBills,
    clearedBills,
    totalAmount: totalAmount[0]?.total || 0,
    pendingAmount: pendingAmount[0]?.total || 0,
  });
});

// Middleware to fetch bill by ID
const getBill = catchAsyncErrors(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id);
  if (bill == null) {
    return next(new ErrorHandler("Bill not found", 404));
  }
  res.bill = bill;
  next();
});

export {
  getBill,
  getAllBills,
  getUserBills,
  getBillById,
  createBill,
  createBulkBills,
  updateBill,
  deleteBill,
  getBillingStats,
};
