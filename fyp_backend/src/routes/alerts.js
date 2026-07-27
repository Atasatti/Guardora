import express from "express";
import {
  createAlert,
  getAlerts,
  updateAlertStatus,
} from "../controllers/alertController.js";

const router = express.Router();

// Public POST for Python script (In production, use API Key middleware)
router.post("/create", createAlert);

// Admin GET/PUT
router.get("/", getAlerts);
router.patch("/:id/status", updateAlertStatus);

export default router;
