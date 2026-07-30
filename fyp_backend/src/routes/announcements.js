import express from "express";
import {
  getAllAnnouncements,
  createAnnouncement,
  getAnnouncement,
  getAnnouncementById,
  deleteAnnouncement,
  updateAnnouncement,
  setPinned,
  voteOnPoll,
  addComment,
} from "../controllers/announcementController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();
const contentManagers = [
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_CONTENT"),
];

router.get("/", isUserAuthenticated, getAllAnnouncements);
router.post(
  "/:id/vote",
  isUserAuthenticated,
  getAnnouncement,
  voteOnPoll
);
router.post(
  "/:id/comments",
  isUserAuthenticated,
  getAnnouncement,
  addComment
);
router.patch(
  "/:id/pin",
  isUserAuthenticated,
  ...contentManagers,
  getAnnouncement,
  setPinned
);
router.get("/:id", isUserAuthenticated, getAnnouncement, getAnnouncementById);
router.post(
  "/",
  isUserAuthenticated,
  ...contentManagers,
  createAnnouncement
);
router.patch(
  "/:id",
  isUserAuthenticated,
  ...contentManagers,
  getAnnouncement,
  updateAnnouncement
);
router.delete(
  "/:id",
  isUserAuthenticated,
  ...contentManagers,
  getAnnouncement,
  deleteAnnouncement
);

export default router;
