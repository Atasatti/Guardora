import express from "express";
import {
  getModerationCases,
  resolveCase,
} from "../controllers/moderationController.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Get all open cases (Admin Only)
router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  getModerationCases
);

// Resolve a case (Admin Only)
router.patch(
  "/:id/resolve",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  resolveCase
);

export default router;
