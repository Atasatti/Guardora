import Announcement from "../models/announcement.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import { notifyRoles } from "../utils/notifications.js";

const getAllAnnouncements = catchAsyncErrors(async (req, res) => {
  const announcements = await Announcement.find({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate("createdBy", "name role profilePicture")
    .populate("comments.author", "name profilePicture")
    .sort({ isPinned: -1, isUrgent: -1, createdAt: -1 });
  res.status(200).json(announcements);
});

const getAnnouncementById = catchAsyncErrors(async (req, res) => {
  await res.announcement.populate([
    { path: "createdBy", select: "name role profilePicture" },
    { path: "comments.author", select: "name profilePicture" },
  ]);
  res.json(res.announcement);
});

const createAnnouncement = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    description,
    isUrgent,
    kind = "ANNOUNCEMENT",
    commentsEnabled = true,
    expiresAt,
  } = req.body;
  if (!title?.trim() || !description?.trim()) {
    return next(new ErrorHandler("Title and description are required", 400));
  }

  const pollOptions =
    kind === "POLL"
      ? (req.body.pollOptions || [])
          .map((option) => ({
            text: String(option.text || option).trim(),
            voters: [],
          }))
          .filter((option) => option.text)
      : [];
  if (kind === "POLL" && pollOptions.length < 2) {
    return next(new ErrorHandler("A poll needs at least two options", 400));
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    description: description.trim(),
    isUrgent: Boolean(isUrgent),
    kind,
    commentsEnabled: Boolean(commentsEnabled),
    expiresAt: expiresAt || null,
    pollOptions,
    createdBy: req.user._id,
  });
  await Promise.all([
    notifyRoles(["RESIDENT", "MODERATOR", "ADMIN"], {
      type: "ANNOUNCEMENT",
      title: announcement.isUrgent
        ? `Urgent: ${announcement.title}`
        : announcement.title,
      message: announcement.description,
      link: "/announcements",
      metadata: { announcementId: announcement._id, kind },
    }),
    recordAudit({
      req,
      action: kind === "POLL" ? "POLL_CREATED" : "ANNOUNCEMENT_CREATED",
      targetModel: "Announcement",
      targetId: announcement._id,
    }),
  ]);
  res.status(201).json(announcement);
});

const updateAnnouncement = catchAsyncErrors(async (req, res) => {
  const fields = [
    "title",
    "description",
    "isUrgent",
    "commentsEnabled",
    "expiresAt",
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      res.announcement[field] = req.body[field];
    }
  }
  const updatedAnnouncement = await res.announcement.save();
  await recordAudit({
    req,
    action: "ANNOUNCEMENT_UPDATED",
    targetModel: "Announcement",
    targetId: updatedAnnouncement._id,
  });
  res.json(updatedAnnouncement);
});

const setPinned = catchAsyncErrors(async (req, res) => {
  res.announcement.isPinned = req.body.isPinned !== false;
  await res.announcement.save();
  await recordAudit({
    req,
    action: res.announcement.isPinned
      ? "ANNOUNCEMENT_PINNED"
      : "ANNOUNCEMENT_UNPINNED",
    targetModel: "Announcement",
    targetId: res.announcement._id,
  });
  res.json(res.announcement);
});

const voteOnPoll = catchAsyncErrors(async (req, res, next) => {
  const announcement = res.announcement;
  if (announcement.kind !== "POLL") {
    return next(new ErrorHandler("This announcement is not a poll", 400));
  }
  if (announcement.expiresAt && announcement.expiresAt <= new Date()) {
    return next(new ErrorHandler("This poll has closed", 409));
  }
  const option = announcement.pollOptions.id(req.body.optionId);
  if (!option) return next(new ErrorHandler("Poll option not found", 404));
  const userId = String(req.user._id);
  const hasVoted = announcement.pollOptions.some((pollOption) =>
    pollOption.voters.some((voter) => String(voter) === userId)
  );
  if (hasVoted) {
    return next(new ErrorHandler("You have already voted in this poll", 409));
  }
  option.voters.push(req.user._id);
  await announcement.save();
  await recordAudit({
    req,
    action: "POLL_VOTE_CAST",
    targetModel: "Announcement",
    targetId: announcement._id,
    details: { optionId: option._id },
  });
  res.json({
    id: announcement._id,
    totalVotes: announcement.pollOptions.reduce(
      (total, pollOption) => total + pollOption.voters.length,
      0
    ),
    options: announcement.pollOptions.map((pollOption) => ({
      id: pollOption._id,
      text: pollOption.text,
      votes: pollOption.voters.length,
    })),
  });
});

const addComment = catchAsyncErrors(async (req, res, next) => {
  if (!res.announcement.commentsEnabled) {
    return next(new ErrorHandler("Comments are disabled", 403));
  }
  const text = String(req.body.text || "").trim();
  if (!text) return next(new ErrorHandler("Comment text is required", 400));
  res.announcement.comments.push({ author: req.user._id, text });
  await res.announcement.save();
  const comment = res.announcement.comments.at(-1);
  await recordAudit({
    req,
    action: "ANNOUNCEMENT_COMMENT_ADDED",
    targetModel: "Announcement",
    targetId: res.announcement._id,
    details: { commentId: comment._id },
  });
  res.status(201).json(comment);
});

const deleteAnnouncement = catchAsyncErrors(async (req, res) => {
  await res.announcement.deleteOne();
  await recordAudit({
    req,
    action: "ANNOUNCEMENT_DELETED",
    targetModel: "Announcement",
    targetId: res.announcement._id,
  });
  res.json({ message: "Announcement deleted" });
});

const getAnnouncement = catchAsyncErrors(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
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
  setPinned,
  voteOnPoll,
  addComment,
  deleteAnnouncement,
};
