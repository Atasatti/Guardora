import express from "express";
import {
  getModerationCases,
  resolveCase,
} from "../controllers/moderationController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// Get all open cases (Admin Only)
router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_CONTENT"),
  getModerationCases
);

// Resolve a case (Admin Only)
router.patch(
  "/:id/resolve",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_CONTENT"),
  resolveCase
);

export default router;
