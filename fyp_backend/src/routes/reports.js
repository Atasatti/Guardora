import express from "express";
import {
  createReport,
  getAllReports,
  getMyReports,
  exportReportsCsv,
  updateReport,
  deleteReport,
} from "../controllers/reportController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import upload from "../multer.js";

const router = express.Router();

// --- RESIDENT / SHARED ROUTES ---

// Create a report
router.post("/", isUserAuthenticated, upload.array("media", 5), createReport);

// Get logged-in user's own reports (Can filter by ?type=X)
router.get("/my-reports", isUserAuthenticated, getMyReports);

// --- ADMIN ROUTES ---

// Get all reports (Can filter by ?type=X&status=Y)
router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  getAllReports
);
router.get(
  "/admin/export.csv",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  exportReportsCsv
);

// Update a report status
router.put(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ALERTS"),
  updateReport
);

// Delete a report
router.delete("/:id", isUserAuthenticated, deleteReport);

export default router;
