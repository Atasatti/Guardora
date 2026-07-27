import express from "express";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  getAllAds,
  applyForAd,
  getMyAds,
  getActiveAds,
  updateAdStatus,
  trackAdClick,
} from "../controllers/adController.js";

const router = express.Router();

// User Routes
router.post("/apply", isUserAuthenticated, applyForAd);
router.get("/my-ads", isUserAuthenticated, getMyAds);
router.get("/active", isUserAuthenticated, getActiveAds); // Public/User access for feed
router.post("/click/:id", trackAdClick);

// Admin Routes
router.get(
  "/admin/all",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  getAllAds
);
router.put(
  "/admin/status/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  updateAdStatus
);

export default router;
