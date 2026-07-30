import express from "express";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import {
  getAllAds,
  applyForAd,
  getMyAds,
  getActiveAds,
  updateAdStatus,
  trackAdClick,
  resubmitAd,
} from "../controllers/adController.js";

const router = express.Router();

// User Routes
router.post("/apply", isUserAuthenticated, applyForAd);
router.get("/my-ads", isUserAuthenticated, getMyAds);
router.get("/active", isUserAuthenticated, getActiveAds); // Public/User access for feed
router.post("/click/:id", isUserAuthenticated, trackAdClick);
router.patch("/:id/resubmit", isUserAuthenticated, resubmitAd);

// Admin Routes
router.get(
  "/admin/all",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ADS"),
  getAllAds
);
router.put(
  "/admin/status/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_ADS"),
  updateAdStatus
);

export default router;
