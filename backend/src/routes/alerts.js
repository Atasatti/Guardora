import express from "express";
import {
  createAlert,
  getAlerts,
  updateAlertStatus,
} from "../controllers/alertController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import { requireAiServiceKey } from "../middlewares/serviceAuth.js";

const router = express.Router();

// Public POST for Python script (In production, use API Key middleware)
router.post("/create", requireAiServiceKey, createAlert);
router.post(
  "/manual",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  createAlert
);

// Admin GET/PUT
router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  getAlerts
);
router.patch(
  "/:id/status",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  updateAlertStatus
);

export default router;
