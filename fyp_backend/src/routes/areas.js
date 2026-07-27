import express from "express";
import {
  seedAreas,
  getAllAreas,
  updateAreaStatus,
} from "../controllers/areaController.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Seed DB (Admin only - call manually via Postman or browser once)
router.post("/seed", isUserAuthenticated, authorizeRoles("ADMIN"), seedAreas);

// Get Map Data (Accessible by Admin & Residents)
router.get("/", isUserAuthenticated, getAllAreas);

// Update Status (Admin/Security only)
router.patch(
  "/:id/status",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  updateAreaStatus
);

export default router;
