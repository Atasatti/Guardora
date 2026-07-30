import {
  getVisionLabModels,
  runVisionLabTest,
} from "../services/aiLabService.js";
import { checkContentSafety } from "../utils/aiModerator.js";
import { removeUploadFile } from "../config/uploads.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

const APPROVED_MODELS = new Set([
  "granite3-guardian-2b",
  "weapon-threat-yolov8n",
  "fire-smoke-yolov8n",
  "violence-x3d",
  "face-recognition-sface",
]);

const confidenceValue = {
  High: 0.95,
  Medium: 0.7,
  Low: 0.35,
};

const moderationStatus = async () => {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(
    /\/+$/,
    ""
  );
  const modelName =
    process.env.OLLAMA_MODERATION_MODEL || "granite3-guardian:2b";

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Ollama status unavailable");
    const payload = await response.json();
    const installed = (payload.models || []).some(
      (model) => model.name === modelName
    );
    return {
      status: installed ? "ready" : "disabled",
      error: installed ? null : `${modelName} is not installed`,
    };
  } catch {
    return {
      status: "disabled",
      error: "Local Ollama moderation service is unavailable",
    };
  }
};

export const getAiLabModels = catchAsyncErrors(async (req, res) => {
  const [moderation, vision] = await Promise.all([
    moderationStatus(),
    getVisionLabModels().catch((error) => ({
      models: [],
      error: error.message,
    })),
  ]);

  res.status(200).json({
    success: true,
    models: [
      {
        id: "granite3-guardian-2b",
        name: "Granite Guardian 3.0 2B",
        description:
          "Screens community text for violence, harassment and unsafe content.",
        input: ["text"],
        license: "Apache-2.0",
        ...moderation,
      },
      ...(vision.models || []),
    ],
    serviceError: vision.error || null,
  });
});

export const runAiLabTest = catchAsyncErrors(async (req, res, next) => {
  const modelId = String(req.body.modelId || "").trim();
  const confidence = Number.parseFloat(req.body.confidence || "0.45");

  if (!APPROVED_MODELS.has(modelId)) {
    removeUploadFile(req.file?.filename);
    return next(new ErrorHandler("Unknown or unapproved AI model", 400));
  }

  if (modelId === "granite3-guardian-2b") {
    removeUploadFile(req.file?.filename);
    const text = String(req.body.text || "").trim();
    if (!text) {
      return next(new ErrorHandler("Enter text to run moderation", 400));
    }

    const started = performance.now();
    const moderation = await checkContentSafety(text, "AI Lab sample");
    const latencyMs = performance.now() - started;
    const numericConfidence =
      confidenceValue[moderation.confidence] || confidenceValue.Low;

    return res.status(200).json({
      success: true,
      result: {
        modelId,
        mediaType: "text",
        alert: !moderation.isSafe,
        confidence: numericConfidence,
        latencyMs: Number(latencyMs.toFixed(1)),
        sampledFrames: 0,
        detections: [
          {
            label: moderation.flaggedCategory,
            confidence: numericConfidence,
          },
        ],
        timeline: [],
        annotatedFrame: null,
        moderation,
      },
    });
  }

  const file = req.file;
  if (!file) {
    return next(new ErrorHandler("Select an image or video to analyze", 400));
  }

  try {
    if (file.size > 50 * 1024 * 1024) {
      return next(new ErrorHandler("File exceeds the 50 MB AI Lab limit", 413));
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      return next(new ErrorHandler("Only image and video files are supported", 415));
    }
    if (modelId === "face-recognition-sface" && !isImage) {
      return next(
        new ErrorHandler(
          "Face recognition accepts an image here; use Surveillance for live video",
          422
        )
      );
    }
    if (modelId === "violence-x3d" && !isVideo) {
      return next(new ErrorHandler("X3D violence analysis requires a video", 422));
    }

    const result = await runVisionLabTest({
      modelId,
      file,
      confidence: Number.isFinite(confidence) ? confidence : 0.45,
    });
    return res.status(200).json({ success: true, result });
  } finally {
    removeUploadFile(file.filename);
  }
});

