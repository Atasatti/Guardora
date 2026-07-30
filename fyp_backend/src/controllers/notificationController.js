import Notification from "../models/notification.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

export const getMyNotifications = catchAsyncErrors(async (req, res) => {
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit || "50", 10), 1),
    100
  );
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);
  const unread = await Notification.countDocuments({
    recipient: req.user._id,
    readAt: null,
  });

  res.status(200).json({ success: true, notifications, unread });
});

export const markNotificationRead = catchAsyncErrors(
  async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return next(new ErrorHandler("Notification not found", 404));
    }
    res.status(200).json({ success: true, notification });
  }
);

export const markAllNotificationsRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, readAt: null },
    { readAt: new Date() }
  );
  res.status(200).json({ success: true });
});
