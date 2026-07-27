import express from "express";
import {
  getAllAnnouncements,
  createAnnouncement,
  getAnnouncement,
  getAnnouncementById,
  deleteAnnouncement,
  updateAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

router.get("/", getAllAnnouncements);
router.get("/:id", getAnnouncement, getAnnouncementById);
router.post("/", createAnnouncement);
router.patch("/:id", getAnnouncement, updateAnnouncement);
router.delete("/:id", getAnnouncement, deleteAnnouncement);

export default router;
