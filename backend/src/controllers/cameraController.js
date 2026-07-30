import Camera from "../models/camera.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import {
  decryptCameraSource,
  encryptCameraSource,
} from "../utils/cameraSecrets.js";
import { createAiStreamToken } from "../utils/aiStreamToken.js";

const canManageAll = (user) =>
  user.role === "ADMIN" ||
  (user.role === "MODERATOR" &&
    user.permissions?.includes("MANAGE_SURVEILLANCE"));

const validateSource = (value) => {
  let parsed;
  try {
    parsed = new URL(String(value));
  } catch {
    return false;
  }
  return ["rtsp:", "rtsps:", "http:", "https:"].includes(parsed.protocol);
};

const listCameras = catchAsyncErrors(async (req, res) => {
  const filter = canManageAll(req.user) ? {} : { owner: req.user._id };
  const cameras = await Camera.find(filter)
    .populate("owner", "name unitNumber")
    .populate("area", "name mapId")
    .sort({ createdAt: -1 });
  res.json({ success: true, cameras });
});

const createCamera = catchAsyncErrors(async (req, res, next) => {
  const { name, sourceUrl, sourceType, areaId } = req.body;
  if (!name?.trim() || !validateSource(sourceUrl)) {
    return next(
      new ErrorHandler("Camera name and a valid RTSP/HTTP source are required", 400)
    );
  }
  const ownerId =
    canManageAll(req.user) && req.body.ownerId
      ? req.body.ownerId
      : req.user._id;
  const localBypass =
    process.env.NODE_ENV !== "production" && process.env.AUTH_BYPASS === "true";
  if (
    !localBypass &&
    !(await User.exists({ _id: ownerId, accountStatus: "ACTIVE" }))
  ) {
    return next(new ErrorHandler("Active camera owner not found", 404));
  }
  const camera = await Camera.create({
    owner: ownerId,
    name: name.trim(),
    area: areaId || null,
    sourceType: sourceType || "RTSP",
    encryptedSource: encryptCameraSource(sourceUrl),
    aiAnalysisEnabled: req.body.aiAnalysisEnabled !== false,
  });
  await recordAudit({
    req,
    action: "CAMERA_ENROLLED",
    targetModel: "Camera",
    targetId: camera._id,
    details: { ownerId, areaId, sourceType: camera.sourceType },
  });
  res.status(201).json({ success: true, camera });
});

const updateCamera = catchAsyncErrors(async (req, res, next) => {
  const camera = await Camera.findById(req.params.id).select(
    "+encryptedSource"
  );
  if (!camera) return next(new ErrorHandler("Camera not found", 404));
  if (!canManageAll(req.user) && String(camera.owner) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  for (const field of ["name", "area", "sourceType", "enabled", "aiAnalysisEnabled"]) {
    if (req.body[field] !== undefined) camera[field] = req.body[field];
  }
  if (req.body.sourceUrl !== undefined) {
    if (!validateSource(req.body.sourceUrl)) {
      return next(new ErrorHandler("Invalid camera source URL", 400));
    }
    camera.encryptedSource = encryptCameraSource(req.body.sourceUrl);
    camera.lastError = null;
  }
  await camera.save();
  res.json({ success: true, camera });
});

const deleteCamera = catchAsyncErrors(async (req, res, next) => {
  const camera = await Camera.findById(req.params.id);
  if (!camera) return next(new ErrorHandler("Camera not found", 404));
  if (!canManageAll(req.user) && String(camera.owner) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  await camera.deleteOne();
  await recordAudit({
    req,
    action: "CAMERA_REMOVED",
    targetModel: "Camera",
    targetId: camera._id,
  });
  res.json({ success: true, message: "Camera removed" });
});

const getCameraSource = catchAsyncErrors(async (req, res, next) => {
  const camera = await Camera.findOne({
    _id: req.params.id,
    enabled: true,
  }).select("+encryptedSource");
  if (!camera) return next(new ErrorHandler("Active camera not found", 404));
  res.json({
    cameraId: camera._id,
    name: camera.name,
    sourceUrl: decryptCameraSource(camera.encryptedSource),
    aiAnalysisEnabled: camera.aiAnalysisEnabled,
  });
});

// Authorises a browser to open the AI service camera stream. The ownership
// check happens here, where the Camera model and role data live; the AI service
// only has to verify the resulting token and that it names the camera it was
// asked to stream.
const createCameraStreamToken = catchAsyncErrors(async (req, res, next) => {
  const camera = await Camera.findOne({ _id: req.params.id, enabled: true });
  if (!camera) return next(new ErrorHandler("Active camera not found", 404));
  if (!canManageAll(req.user) && String(camera.owner) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }

  const { token, expiresInSeconds } = createAiStreamToken({
    userId: req.user._id,
    cameraId: camera._id,
  });
  res.json({ success: true, token, expiresInSeconds });
});

// Demo video playback and the operator's own webcam carry no per-object
// authorisation, so an authenticated session is the whole requirement.
const createGeneralStreamToken = catchAsyncErrors(async (req, res) => {
  const { token, expiresInSeconds } = createAiStreamToken({
    userId: req.user._id,
  });
  res.json({ success: true, token, expiresInSeconds });
});

export {
  listCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  getCameraSource,
  createCameraStreamToken,
  createGeneralStreamToken,
};
