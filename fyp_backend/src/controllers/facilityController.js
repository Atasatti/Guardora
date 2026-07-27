import Facility from "../models/facility.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllFacilities = catchAsyncErrors(async (req, res) => {
  const facilities = await Facility.find();
  res.status(200).json(facilities);
});

const getFacilityById = catchAsyncErrors(async (req, res) => {
  res.json(res.facility);
});

const createFacility = catchAsyncErrors(async (req, res) => {
  const {
    name,
    imageUrl,
    description,
    totalCapacity,
    availableCapacity,
    isPaidService,
    pricePerHour,
    rules,
    openTime,
    closeTime,
  } = req.body;

  const facility = new Facility({
    name,
    imageUrl,
    description,
    totalCapacity,
    availableCapacity,
    isPaidService,
    pricePerHour,
    rules,
    openTime,
    closeTime,
  });

  await facility.save();
  res.status(201).json(facility);
});

const updateFacility = catchAsyncErrors(async (req, res) => {
  if (req.body.name != null) {
    res.facility.name = req.body.name;
  }
  if (req.body.imageUrl != null) {
    res.facility.imageUrl = req.body.imageUrl;
  }
  if (req.body.description != null) {
    res.facility.description = req.body.description;
  }
  if (req.body.totalCapacity != null) {
    res.facility.totalCapacity = req.body.totalCapacity;
  }
  if (req.body.availableCapacity != null) {
    res.facility.availableCapacity = req.body.availableCapacity;
  }
  if (req.body.isPaidService != null) {
    res.facility.isPaidService = req.body.isPaidService;
  }
  if (req.body.pricePerHour != null) {
    res.facility.pricePerHour = req.body.pricePerHour;
  }
  if (req.body.rules != null) {
    res.facility.rules = req.body.rules;
  }
  if (req.body.openTime != null) {
    res.facility.openTime = req.body.openTime;
  }
  if (req.body.closeTime != null) {
    res.facility.closeTime = req.body.closeTime;
  }

  const updatedFacility = await res.facility.save();
  res.json(updatedFacility);
});

const deleteFacility = catchAsyncErrors(async (req, res) => {
  await res.facility.deleteOne();
  res.json({ message: "Facility deleted" });
});

// Middleware
const getFacility = catchAsyncErrors(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id);
  if (facility == null) {
    return next(new ErrorHandler("Facility not found", 404));
  }
  res.facility = facility;
  next();
});

export {
  getFacility,
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
};
