import express from "express";
import {
  seedAreas,
  getAllAreas,
  updateAreaStatus,
  reportDangerousArea,
  getSafeRouteGuidance,
  calculateSafeRoute,
} from "../controllers/areaController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// Seed DB (Admin only - call manually via Postman or browser once)
router.post("/seed", isUserAuthenticated, authorizeRoles("ADMIN"), seedAreas);

// Get Map Data (Accessible by Admin & Residents)
router.get("/", isUserAuthenticated, getAllAreas);
router.get("/safe-route", isUserAuthenticated, getSafeRouteGuidance);
router.post("/safe-route", isUserAuthenticated, calculateSafeRoute);
router.post(
  "/:id/reports",
  isUserAuthenticated,
  reportDangerousArea
);

// Update Status (Admin/Security only)
router.patch(
  "/:id/status",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_MAP"),
  updateAreaStatus
);

export default router;
