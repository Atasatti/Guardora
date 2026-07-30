import express from "express";
import { isUserAuthenticated } from "../middlewares/auth.js";
import { requireAiServiceKey } from "../middlewares/serviceAuth.js";
import {
  createCamera,
  createCameraStreamToken,
  createGeneralStreamToken,
  deleteCamera,
  getCameraSource,
  listCameras,
  updateCamera,
} from "../controllers/cameraController.js";

const router = express.Router();

router.get("/", isUserAuthenticated, listCameras);
router.post("/", isUserAuthenticated, createCamera);
router.post("/stream-token", isUserAuthenticated, createGeneralStreamToken);
router.post("/:id/stream-token", isUserAuthenticated, createCameraStreamToken);
router.get("/:id/source", requireAiServiceKey, getCameraSource);
router.patch("/:id", isUserAuthenticated, updateCamera);
router.delete("/:id", isUserAuthenticated, deleteCamera);

export default router;
