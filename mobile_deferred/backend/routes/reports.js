import express from "express";
import {
  createReport,
  getAllReports,
  getMyReports,
  updateReport,
  deleteReport,
} from "../controllers/reportController.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// --- RESIDENT / SHARED ROUTES ---

// Create a report
router.post("/", isUserAuthenticated, createReport);

// Get logged-in user's own reports (Can filter by ?type=X)
router.get("/my-reports", isUserAuthenticated, getMyReports);

// --- ADMIN ROUTES ---

// Get all reports (Can filter by ?type=X&status=Y)
router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  getAllReports
);

// Update a report status
router.put(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  updateReport
);

// Delete a report
router.delete("/:id", isUserAuthenticated, deleteReport);

export default router;
