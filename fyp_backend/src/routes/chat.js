import express from "express";
import { isUserAuthenticated } from "../middlewares/auth.js";
import {
  sendMessage,
  getMessages,
  getInbox,
} from "../controllers/chatController.js";

const router = express.Router();

// Send a message (POST /api/chat/send)
router.post("/send", isUserAuthenticated, sendMessage);

// Get history with specific user (GET /api/chat/history/:id)
router.get("/history/:id", isUserAuthenticated, getMessages);

// Get all conversations (GET /api/chat/inbox)
router.get("/inbox", isUserAuthenticated, getInbox);

export default router;
