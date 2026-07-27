import express from "express";
import {
  triggerSOS,
  cancelSOS,
  getActiveEmergencies,
  resolveEmergency,
} from "../controllers/emergencyController.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// --- RESIDENT ---
router.post("/trigger", isUserAuthenticated, triggerSOS);
router.patch("/cancel", isUserAuthenticated, cancelSOS); // <--- New Route

// --- ADMIN ---
router.get(
  "/active",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  getActiveEmergencies
);

router.patch(
  "/:id/resolve",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  resolveEmergency
);

export default router;
