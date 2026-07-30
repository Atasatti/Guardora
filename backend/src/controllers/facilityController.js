import Facility from "../models/facility.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Reservation from "../models/reservation.js";
import { recordAudit } from "../utils/audit.js";

const getAllFacilities = catchAsyncErrors(async (req, res) => {
  const facilities = await Facility.find();
  res.status(200).json(facilities);
});

const getFacilityById = catchAsyncErrors(async (req, res) => {
  res.json(res.facility);
});

const createFacility = catchAsyncErrors(async (req, res, next) => {
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
  const capacity = Number(totalCapacity);
  const available = Number(availableCapacity);
  const price = isPaidService ? Number(pricePerHour) : 0;
  if (
    !name?.trim() ||
    !description?.trim() ||
    !imageUrl ||
    !Number.isFinite(capacity) ||
    capacity < 1 ||
    !Number.isFinite(available) ||
    available < 0 ||
    available > capacity ||
    !Array.isArray(rules) ||
    !openTime ||
    !closeTime ||
    (isPaidService && (!Number.isFinite(price) || price < 0))
  ) {
    return next(new ErrorHandler("Valid facility details are required", 400));
  }

  const facility = new Facility({
    name,
    imageUrl,
    description,
    totalCapacity: capacity,
    availableCapacity: available,
    isPaidService,
    pricePerHour: price,
    rules,
    openTime,
    closeTime,
  });

  await facility.save();
  await recordAudit({
    req,
    action: "FACILITY_CREATED",
    targetModel: "Facility",
    targetId: facility._id,
  });
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
  await recordAudit({
    req,
    action: "FACILITY_UPDATED",
    targetModel: "Facility",
    targetId: updatedFacility._id,
  });
  res.json(updatedFacility);
});

const deleteFacility = catchAsyncErrors(async (req, res, next) => {
  const activeReservations = await Reservation.countDocuments({
    facilityId: res.facility._id,
    status: "CONFIRMED",
    endDate: { $gt: new Date() },
  });
  if (activeReservations) {
    return next(
      new ErrorHandler(
        `Cancel ${activeReservations} active reservation(s) before deleting this facility`,
        409
      )
    );
  }
  await res.facility.deleteOne();
  await recordAudit({
    req,
    action: "FACILITY_DELETED",
    targetModel: "Facility",
    targetId: res.facility._id,
  });
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
