import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { io, userSocketMap } from "../server.js"; // Import from your main server file

// 1. Send a Message (Save DB + Emit Socket)
export const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const { receiverId, text } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !text) {
    return next(new ErrorHandler("Receiver and text are required", 400));
  }

  // A. Find or Create Conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  // B. Create new Message
  const newMessage = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    text,
  });

  // C. Update Last Message in Conversation (for Inbox view)
  conversation.lastMessage = newMessage._id;
  await conversation.save();

  // D. SOCKET IO EMIT (Real-time magic)
  const receiverSocketId = userSocketMap.get(receiverId);

  if (receiverSocketId) {
    // If receiver is online, send data immediately
    io.to(receiverSocketId).emit("receive_message", {
      _id: newMessage._id,
      sender: senderId,
      text: text,
      createdAt: newMessage.createdAt,
      conversationId: conversation._id,
    });
  }

  res.status(201).json({
    success: true,
    message: newMessage,
  });
});

// 2. Get Chat History with a specific user
export const getMessages = catchAsyncErrors(async (req, res, next) => {
  const { id: receiverId } = req.params;
  const senderId = req.user.id;

  const conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    return res.status(200).json({ success: true, messages: [] });
  }

  const messages = await Message.find({
    conversationId: conversation._id,
  }).sort({ createdAt: 1 }); // Oldest first

  res.status(200).json({
    success: true,
    messages,
  });
});

// 3. Get My Inbox (List of conversations)
export const getInbox = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate({
      path: "participants",
      select: "name profilePicture unitNumber", // Fields to show in inbox
    })
    .populate({
      path: "lastMessage",
      select: "text createdAt sender isRead",
    })
    .sort({ updatedAt: -1 }); // Newest conversations first

  // Filter the data to make it easy for frontend (identify 'other' user)
  const inboxData = conversations.map((conv) => {
    const otherUser = conv.participants.find(
      (p) => p._id.toString() !== userId
    );
    return {
      conversationId: conv._id,
      otherUser: otherUser, // The person I'm talking to
      lastMessage: conv.lastMessage,
    };
  });

  res.status(200).json({
    success: true,
    conversations: inboxData,
  });
});
