import express from "express";
import {
  getAiLabModels,
  runAiLabTest,
} from "../controllers/aiLabController.js";
import { authorizeRoles, isUserAuthenticated } from "../middlewares/auth.js";
import upload from "../multer.js";

const router = express.Router();

router.get(
  "/models",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  getAiLabModels
);
router.post(
  "/test",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  upload.single("file"),
  runAiLabTest
);

export default router;

