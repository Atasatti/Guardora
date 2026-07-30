import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { io, userSocketMap } from "../server.js";
import { createNotification } from "../utils/notifications.js";
import { recordAudit } from "../utils/audit.js";

const directKeyFor = (left, right) =>
  [String(left), String(right)].sort().join(":");

const isParticipant = (conversation, userId) =>
  conversation.participants.some(
    (participant) =>
      String(participant?._id || participant) === String(userId)
  );

const blockedInteraction = async (firstId, secondId) => {
  const [first, second] = await Promise.all([
    User.findById(firstId).select("blockedUsers accountStatus"),
    User.findById(secondId).select(
      "blockedUsers accountStatus friends privacySettings.messagePermission"
    ),
  ]);
  if (
    !first ||
    !second ||
    (second.accountStatus && second.accountStatus !== "ACTIVE")
  ) {
    return true;
  }
  return (
    first.blockedUsers?.some((id) => String(id) === String(secondId)) ||
    second.blockedUsers?.some((id) => String(id) === String(firstId)) ||
    second.privacySettings?.messagePermission === "NONE" ||
    (second.privacySettings?.messagePermission === "FRIENDS" &&
      !second.friends?.some((id) => String(id) === String(firstId)))
  );
};

const emitMessage = (conversation, message) => {
  for (const participant of conversation.participants) {
    const recipientId = String(participant?._id || participant);
    if (recipientId === String(message.sender)) continue;
    const socketId = userSocketMap.get(recipientId);
    if (socketId) {
      io.to(socketId).emit("receive_message", {
        ...message.toObject(),
        conversationId: conversation._id,
      });
    }
  }
};

const saveMessage = async ({ conversation, senderId, text, attachments }) => {
  const messageText = String(text || "").trim();
  const safeAttachments = Array.isArray(attachments)
    ? attachments.slice(0, 10)
    : [];
  const message = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    text: messageText,
    attachments: safeAttachments,
    readBy: [senderId],
  });
  conversation.lastMessage = message._id;
  conversation.deletedFor = conversation.deletedFor.filter(
    (userId) => String(userId) !== String(senderId)
  );
  await conversation.save();
  emitMessage(conversation, message);
  return message;
};

export const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const { receiverId, text, attachments } = req.body;
  const senderId = req.user._id;
  if (
    !receiverId ||
    (!String(text || "").trim() && !attachments?.length) ||
    String(receiverId) === String(senderId)
  ) {
    return next(
      new ErrorHandler("A receiver and message content are required", 400)
    );
  }
  if (await blockedInteraction(senderId, receiverId)) {
    return next(new ErrorHandler("Messaging is unavailable for this user", 403));
  }

  const directKey = directKeyFor(senderId, receiverId);
  let conversation = await Conversation.findOne({ directKey });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
      type: "DIRECT",
      directKey,
    });
  }
  const message = await saveMessage({
    conversation,
    senderId,
    text,
    attachments,
  });
  await createNotification({
    recipient: receiverId,
    type: "MESSAGE",
    title: `New message from ${req.user.name}`,
    message: message.text || "Sent an attachment",
    link: "/messages",
    metadata: { conversationId: conversation._id },
  });
  res.status(201).json({ success: true, message });
});

export const createGroup = catchAsyncErrors(async (req, res, next) => {
  const name = String(req.body.name || "").trim();
  const participantIds = [
    ...new Set(
      [String(req.user._id), ...(req.body.participantIds || []).map(String)]
    ),
  ];
  if (!name || participantIds.length < 3 || participantIds.length > 100) {
    return next(
      new ErrorHandler(
        "Group name and 3-100 unique participants are required",
        400
      )
    );
  }
  const activeUsers = await User.countDocuments({
    _id: { $in: participantIds },
    accountStatus: { $nin: ["SUSPENDED", "DEACTIVATED"] },
  });
  if (activeUsers !== participantIds.length) {
    return next(new ErrorHandler("One or more participants are unavailable", 400));
  }

  const conversation = await Conversation.create({
    participants: participantIds,
    type: "GROUP",
    name,
    admins: [req.user._id],
  });
  await recordAudit({
    req,
    action: "CHAT_GROUP_CREATED",
    targetModel: "Conversation",
    targetId: conversation._id,
    details: { participantCount: participantIds.length },
  });
  res.status(201).json(conversation);
});

export const sendConversationMessage = catchAsyncErrors(
  async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !isParticipant(conversation, req.user._id)) {
      return next(new ErrorHandler("Conversation not found", 404));
    }
    if (!String(req.body.text || "").trim() && !req.body.attachments?.length) {
      return next(new ErrorHandler("Message content is required", 400));
    }
    const message = await saveMessage({
      conversation,
      senderId: req.user._id,
      text: req.body.text,
      attachments: req.body.attachments,
    });
    const recipients = conversation.participants.filter(
      (participant) => String(participant) !== String(req.user._id)
    );
    await Promise.allSettled(
      recipients.map((recipient) =>
        createNotification({
          recipient,
          type: "MESSAGE",
          title:
            conversation.type === "GROUP"
              ? `${conversation.name}: ${req.user.name}`
              : `New message from ${req.user.name}`,
          message: message.text || "Sent an attachment",
          link: "/messages",
          metadata: { conversationId: conversation._id },
        })
      )
    );
    res.status(201).json({ success: true, message });
  }
);

export const getMessages = catchAsyncErrors(async (req, res) => {
  const directKey = directKeyFor(req.user._id, req.params.id);
  const conversation = await Conversation.findOne({ directKey });
  if (!conversation) {
    return res.status(200).json({ success: true, messages: [] });
  }
  const messages = await Message.find({
    conversationId: conversation._id,
    deletedFor: { $ne: req.user._id },
  }).sort({ createdAt: 1 });
  res.status(200).json({ success: true, messages });
});

export const getConversationMessages = catchAsyncErrors(
  async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !isParticipant(conversation, req.user._id)) {
      return next(new ErrorHandler("Conversation not found", 404));
    }
    const messages = await Message.find({
      conversationId: conversation._id,
      deletedFor: { $ne: req.user._id },
    }).sort({ createdAt: 1 });
    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id }, $set: { isRead: true } }
    );
    res.json({ success: true, conversation, messages });
  }
);

export const getInbox = catchAsyncErrors(async (req, res) => {
  const userId = String(req.user._id);
  const conversations = await Conversation.find({
    participants: req.user._id,
    deletedFor: { $ne: req.user._id },
  })
    .populate("participants", "name profilePicture unitNumber role")
    .populate("lastMessage", "text attachments createdAt sender isRead readBy")
    .sort({ updatedAt: -1 });

  const inboxData = conversations.map((conversation) => ({
    conversationId: conversation._id,
    type: conversation.type,
    name: conversation.name,
    participants: conversation.participants,
    otherUser:
      conversation.type === "DIRECT"
        ? conversation.participants.find(
            (participant) => String(participant._id) !== userId
          )
        : null,
    lastMessage: conversation.lastMessage,
  }));
  res.json({ success: true, conversations: inboxData });
});

export const deleteConversationForUser = catchAsyncErrors(
  async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !isParticipant(conversation, req.user._id)) {
      return next(new ErrorHandler("Conversation not found", 404));
    }
    await Promise.all([
      Conversation.updateOne(
        { _id: conversation._id },
        { $addToSet: { deletedFor: req.user._id } }
      ),
      Message.updateMany(
        { conversationId: conversation._id },
        { $addToSet: { deletedFor: req.user._id } }
      ),
    ]);
    res.json({ message: "Conversation deleted for your account" });
  }
);
