import express from "express";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  getBannedPersons,
  addBannedPerson,
  unbanPerson,
} from "../controllers/bannedPersonController.js";
import upload from "../multer.js";

const router = express.Router();

router.get("/", getBannedPersons);
router.post("/", upload.single("image"), addBannedPerson);
router.delete(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  unbanPerson
);

export default router;
