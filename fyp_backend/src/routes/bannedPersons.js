import express from "express";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";
import {
  getBannedPersons,
  addBannedPerson,
  syncBannedPersons,
  unbanPerson,
  getBannedPersonTimeline,
} from "../controllers/bannedPersonController.js";
import upload from "../multer.js";

const router = express.Router();

router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  getBannedPersons
);
router.post(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  upload.single("image"),
  addBannedPerson
);
router.post(
  "/sync",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  syncBannedPersons
);
router.get(
  "/:id/timeline",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  getBannedPersonTimeline
);
router.delete(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_SURVEILLANCE"),
  unbanPerson
);

export default router;
