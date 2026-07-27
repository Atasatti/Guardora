import Announcement from "../models/announcement.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllAnnouncements = catchAsyncErrors(async (req, res) => {
  const announcements = await Announcement.find();
  res.status(200).json(announcements);
});

const getAnnouncementById = catchAsyncErrors(async (req, res) => {
  res.json(res.announcement);
});

const createAnnouncement = catchAsyncErrors(async (req, res) => {
  const { title, description, isUrgent } = req.body;
  const announcement = new Announcement({ title, description, isUrgent });
  await announcement.save();
  res.status(201).json(announcement);
});

const updateAnnouncement = catchAsyncErrors(async (req, res) => {
  if (req.body.title != null) {
    res.announcement.title = req.body.title;
  }
  if (req.body.description != null) {
    res.announcement.description = req.body.description;
  }
  if (req.body.isUrgent != null) {
    res.announcement.isUrgent = req.body.isUrgent;
  }

  const updatedAnnouncement = await res.announcement.save();
  res.json(updatedAnnouncement);
});

const deleteAnnouncement = catchAsyncErrors(async (req, res) => {
  await res.announcement.deleteOne();
  res.json({ message: "Announcement deleted" });
});

// Middleware
const getAnnouncement = catchAsyncErrors(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);
  if (announcement == null) {
    return next(new ErrorHandler("Announcement not found", 404));
  }
  res.announcement = announcement;
  next();
});

export {
  getAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
