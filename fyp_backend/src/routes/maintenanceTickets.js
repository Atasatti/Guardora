import express from "express";
import {
  getTicket,
  getAllTickets,
  getUserTickets,
  exportMaintenanceCsv,
  getTicketById,
  createTicket,
  assignTicket,
  updateTicket,
  submitFeedback,
  getMaintenanceStats,
  deleteTicket,
} from "../controllers/maintenanceTicketController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import upload from "../multer.js";

const router = express.Router();
const managers = [
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_MAINTENANCE"),
];

router.get(
  "/",
  isUserAuthenticated,
  ...managers,
  getAllTickets
);
router.get("/user", isUserAuthenticated, getUserTickets);
router.get(
  "/admin/stats",
  isUserAuthenticated,
  ...managers,
  getMaintenanceStats
);
router.get(
  "/admin/export.csv",
  isUserAuthenticated,
  ...managers,
  exportMaintenanceCsv
);
router.patch(
  "/:id/assign",
  isUserAuthenticated,
  ...managers,
  getTicket,
  assignTicket
);
router.post(
  "/:id/feedback",
  isUserAuthenticated,
  getTicket,
  submitFeedback
);
router.get("/:id", isUserAuthenticated, getTicket, getTicketById);
router.post(
  "/",
  isUserAuthenticated,
  upload.array("attachments", 5),
  createTicket
);
router.patch(
  "/:id",
  isUserAuthenticated,
  ...managers,
  getTicket,
  updateTicket
);
router.delete(
  "/:id",
  isUserAuthenticated,
  ...managers,
  getTicket,
  deleteTicket
);

export default router;
