import express from "express";
import {
  getAllReservations,
  createReservation,
  getReservation,
  getReservationById,
  deleteReservation,
  updateReservation,
  getReservationsByFacility,
  checkInReservation,
  processReservations,
  getReservationStats,
  exportReservationsCsv,
} from "../controllers/reservationController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();
const facilityManagers = [
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_FACILITIES"),
];

router.get("/", isUserAuthenticated, getAllReservations);
router.get(
  "/admin/stats",
  isUserAuthenticated,
  ...facilityManagers,
  getReservationStats
);
router.get(
  "/admin/export.csv",
  isUserAuthenticated,
  ...facilityManagers,
  exportReservationsCsv
);
router.post(
  "/admin/process",
  isUserAuthenticated,
  ...facilityManagers,
  processReservations
);
router.get(
  "/facility/:facilityId",
  isUserAuthenticated,
  getReservationsByFacility
);
router.get("/:id", isUserAuthenticated, getReservation, getReservationById);
router.post(
  "/:id/check-in",
  isUserAuthenticated,
  ...facilityManagers,
  getReservation,
  checkInReservation
);
router.post("/", isUserAuthenticated, createReservation);
router.patch(
  "/:id",
  isUserAuthenticated,
  getReservation,
  updateReservation
);
router.delete(
  "/:id",
  isUserAuthenticated,
  getReservation,
  deleteReservation
);

export default router;
