import express from "express";
import {
  getTicket,
  getAllTickets,
  getUserTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/maintenanceTicketController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllTickets);
router.get("/user", isUserAuthenticated, getUserTickets);
router.get("/:id", getTicket, getTicketById);
router.post("/", isUserAuthenticated, createTicket);
router.patch("/:id", getTicket, updateTicket);
router.delete("/:id", getTicket, deleteTicket);

export default router;
