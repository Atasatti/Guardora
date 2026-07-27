import Visitor from "../models/visitor.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllVisitors = catchAsyncErrors(async (req, res) => {
  const visitors = await Visitor.find();
  res.status(200).json(visitors);
});

const getResidentVisitors = catchAsyncErrors(async (req, res) => {
  const visitors = await Visitor.find({ host: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json(visitors);
});

const getVisitorById = catchAsyncErrors(async (req, res) => {
  res.json(res.visitor);
});

const createVisitor = catchAsyncErrors(async (req, res) => {
  const { name, phoneNumber, visitDate, type, status, photoUrl } = req.body;
  let { entryCode } = req.body;
  if (!entryCode) {
    entryCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const visitor = new Visitor({
    name,
    phoneNumber,
    visitDate,
    type,
    status: status || "ACTIVE",
    photoUrl,
    entryCode,
    host: req.user._id,
  });

  const newVisitor = await visitor.save();
  res.status(201).json(newVisitor);
});

const updateVisitor = catchAsyncErrors(async (req, res) => {
  const fields = [
    "name",
    "phoneNumber",
    "visitDate",
    "type",
    "status",
    "photoUrl",
    "entryCode",
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
  await res.visitor.deleteOne();
  res.json({ message: "Visitor deleted" });
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
};
