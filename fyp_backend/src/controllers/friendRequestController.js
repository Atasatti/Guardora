import FriendRequest from "../models/friendRequest.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { createNotification } from "../utils/notifications.js";

export const listFriendRequests = catchAsyncErrors(async (req, res) => {
  const requests = await FriendRequest.find({
    $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    status: req.query.status || "PENDING",
  })
    .populate("sender", "name profilePicture unitNumber")
    .populate("recipient", "name profilePicture unitNumber")
    .sort({ createdAt: -1 });
  res.json(requests);
});

export const sendFriendRequest = catchAsyncErrors(async (req, res, next) => {
  const recipientId = req.params.userId;
  if (String(recipientId) === String(req.user._id)) {
    return next(new ErrorHandler("You cannot add yourself", 400));
  }
  const [sender, recipient] = await Promise.all([
    User.findById(req.user._id),
    User.findById(recipientId),
  ]);
  if (
    !recipient ||
    (recipient.accountStatus && recipient.accountStatus !== "ACTIVE")
  ) {
    return next(new ErrorHandler("Resident not found", 404));
  }
  const blocked =
    sender.blockedUsers.some((id) => String(id) === String(recipientId)) ||
    recipient.blockedUsers.some((id) => String(id) === String(req.user._id));
  if (blocked) return next(new ErrorHandler("This interaction is blocked", 403));
  if (sender.friends.some((id) => String(id) === String(recipientId))) {
    return next(new ErrorHandler("You are already friends", 409));
  }
  const existing = await FriendRequest.exists({
    $or: [
      { sender: req.user._id, recipient: recipientId },
      { sender: recipientId, recipient: req.user._id },
    ],
    status: "PENDING",
  });
  if (existing) return next(new ErrorHandler("Request is already pending", 409));

  const request = await FriendRequest.create({
    sender: req.user._id,
    recipient: recipientId,
  });
  await createNotification({
    recipient: recipientId,
    type: "SYSTEM",
    title: "New friend request",
    message: `${req.user.name} sent you a friend request.`,
    link: "/users",
    metadata: { friendRequestId: request._id },
  });
  res.status(201).json(request);
});

export const respondFriendRequest = catchAsyncErrors(async (req, res, next) => {
  const request = await FriendRequest.findById(req.params.id);
  if (!request || String(request.recipient) !== String(req.user._id)) {
    return next(new ErrorHandler("Friend request not found", 404));
  }
  if (request.status !== "PENDING") {
    return next(new ErrorHandler("Friend request is no longer pending", 409));
  }
  const status = String(req.body.status || "").toUpperCase();
  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return next(new ErrorHandler("Status must be ACCEPTED or REJECTED", 400));
  }
  request.status = status;
  request.respondedAt = new Date();
  if (status === "ACCEPTED") {
    await Promise.all([
      User.updateOne(
        { _id: request.sender },
        { $addToSet: { friends: request.recipient } }
      ),
      User.updateOne(
        { _id: request.recipient },
        { $addToSet: { friends: request.sender } }
      ),
    ]);
  }
  await request.save();
  await createNotification({
    recipient: request.sender,
    type: "SYSTEM",
    title: `Friend request ${status.toLowerCase()}`,
    message: `${req.user.name} ${status.toLowerCase()} your friend request.`,
    link: "/users",
    metadata: { friendRequestId: request._id },
  });
  res.json(request);
});

export const cancelFriendRequest = catchAsyncErrors(async (req, res, next) => {
  const request = await FriendRequest.findById(req.params.id);
  if (!request || String(request.sender) !== String(req.user._id)) {
    return next(new ErrorHandler("Friend request not found", 404));
  }
  if (request.status !== "PENDING") {
    return next(new ErrorHandler("Only pending requests can be cancelled", 409));
  }
  request.status = "CANCELLED";
  request.respondedAt = new Date();
  await request.save();
  res.json(request);
});
