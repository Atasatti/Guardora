import Service from "../../../fyp_backend/src/models/service.js";
import catchAsyncErrors from "../../../fyp_backend/src/middlewares/catchAsyncErrors.js";
import ErrorHandler from "../../../fyp_backend/src/utils/ErrorHandler.js";

// Get all services
const getAllServices = catchAsyncErrors(async (req, res) => {
  const { query, category, serviceType } = req.query;
  
  let filter = {};
  
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  
  if (category) {
    filter.category = category;
  }
  
  if (serviceType) {
    filter.serviceType = serviceType;
  }

  const services = await Service.find(filter)
    .populate('provider', 'name profilePicture unitNumber')
    .sort({ createdAt: -1 });
  
  res.json(services);
});

// Get service by ID
const getServiceById = catchAsyncErrors(async (req, res) => {
  res.json(res.service);
});

// Create a new service
const createService = catchAsyncErrors(async (req, res) => {
  const { title, description, price, category, serviceType, duration } = req.body;
  const provider = req.user.id;

  // Get uploaded image URLs
  const images = req.files ? req.files.map(file => `uploads/${file.filename}`) : [];

  const service = new Service({
    provider,
    title,
    description,
    price,
    category,
    serviceType,
    duration,
    images,
  });

  const newService = await service.save();
  await newService.populate("provider", "name profilePicture unitNumber");
  res.status(201).json(newService);
});

// Update an existing service
const updateService = catchAsyncErrors(async (req, res) => {
  const { title, description, price, category, serviceType, duration, images, status } = req.body;

  if (title != null) res.service.title = title;
  if (description != null) res.service.description = description;
  if (price != null) res.service.price = price;
  if (category != null) res.service.category = category;
  if (serviceType != null) res.service.serviceType = serviceType;
  if (duration != null) res.service.duration = duration;
  if (images != null) res.service.images = images;
  if (status != null) res.service.status = status;

  const updatedService = await res.service.save();
  await updatedService.populate("provider", "name profilePicture unitNumber");
  res.json(updatedService);
});

// Delete a service
const deleteService = catchAsyncErrors(async (req, res) => {
  await res.service.deleteOne();
  res.json({ message: "Service deleted" });
});

// Get user's services
const getUserServices = catchAsyncErrors(async (req, res) => {
  const userId = req.params.userId;
  const services = await Service.find({ provider: userId })
    .populate("provider", "name profilePicture unitNumber")
    .sort({ createdAt: -1 });
  res.status(200).json(services);
});

// Update service status
const updateServiceStatus = catchAsyncErrors(async (req, res) => {
  const { status } = req.body;
  
  if (status != null) res.service.status = status;

  const updatedService = await res.service.save();
  await updatedService.populate("provider", "name profilePicture unitNumber");
  res.json(updatedService);
});

// Middleware to fetch service by ID
const getService = catchAsyncErrors(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate(
    "provider",
    "name profilePicture unitNumber"
  );

  if (service == null) {
    return next(new ErrorHandler("Service not found", 404));
  }

  res.service = service;
  next();
});

export {
  getService,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getUserServices,
  updateServiceStatus,
};
