import express from "express";
import { isUserAuthenticated } from "../middlewares/auth.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", isUserAuthenticated, getMyNotifications);
router.patch("/read-all", isUserAuthenticated, markAllNotificationsRead);
router.patch("/:id/read", isUserAuthenticated, markNotificationRead);

export default router;
