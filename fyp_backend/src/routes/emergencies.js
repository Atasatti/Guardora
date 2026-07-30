import express from "express";
import {
  triggerSOS,
  cancelSOS,
  getActiveEmergencies,
  resolveEmergency,
  updateEmergencyLocation,
} from "../controllers/emergencyController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// --- RESIDENT ---
router.post("/trigger", isUserAuthenticated, triggerSOS);
router.patch("/location", isUserAuthenticated, updateEmergencyLocation);
router.patch("/cancel", isUserAuthenticated, cancelSOS); // <--- New Route

// --- ADMIN ---
router.get(
  "/active",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  getActiveEmergencies
);

router.patch(
  "/:id/resolve",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  resolveEmergency
);

export default router;
