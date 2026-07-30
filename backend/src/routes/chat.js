import express from "express";
import { isUserAuthenticated } from "../middlewares/auth.js";
import {
  sendMessage,
  getMessages,
  getInbox,
  createGroup,
  sendConversationMessage,
  getConversationMessages,
  deleteConversationForUser,
} from "../controllers/chatController.js";

const router = express.Router();

// Send a message (POST /api/chat/send)
router.post("/send", isUserAuthenticated, sendMessage);
router.post("/groups", isUserAuthenticated, createGroup);
router.post(
  "/conversations/:id/messages",
  isUserAuthenticated,
  sendConversationMessage
);
router.get(
  "/conversations/:id/messages",
  isUserAuthenticated,
  getConversationMessages
);
router.delete(
  "/conversations/:id",
  isUserAuthenticated,
  deleteConversationForUser
);

// Get history with specific user (GET /api/chat/history/:id)
router.get("/history/:id", isUserAuthenticated, getMessages);

// Get all conversations (GET /api/chat/inbox)
router.get("/inbox", isUserAuthenticated, getInbox);

export default router;
