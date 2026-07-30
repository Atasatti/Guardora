import express from "express";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import {
  getAuditLogs,
  getSuspiciousActivity,
} from "../controllers/auditLogController.js";

const router = express.Router();

router.get(
  "/suspicious",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  getSuspiciousActivity
);

router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  getAuditLogs
);

export default router;
