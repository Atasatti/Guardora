import express from "express";
import {
  getAllReservations,
  createReservation,
  getReservation,
  getReservationById,
  deleteReservation,
  updateReservation,
  getReservationsByFacility,
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/", getAllReservations);
router.get("/:id", getReservation, getReservationById);
router.get("/facility/:facilityId", getReservationsByFacility);
router.post("/", createReservation);
router.patch("/:id", getReservation, updateReservation);
router.delete("/:id", getReservation, deleteReservation);

export default router;
