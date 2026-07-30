import fs from "node:fs/promises";
import { uploadDiskPath } from "../config/uploads.js";

const aiServiceUrl = (
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8001"
).replace(/\/+$/, "");
const requestTimeoutMs = Number.parseInt(
  process.env.AI_LAB_TIMEOUT_MS || "180000",
  10
);

const requestAi = async (pathname, options = {}, timeoutMs = requestTimeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${aiServiceUrl}${pathname}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        payload.detail || payload.message || "AI inference request failed"
      );
      error.statusCode =
        response.status >= 400 && response.status < 500 ? response.status : 502;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error?.statusCode) throw error;
    const serviceError = new Error(
      error?.name === "AbortError"
        ? "AI inference timed out"
        : "AI inference service is unavailable"
    );
    serviceError.statusCode = error?.name === "AbortError" ? 504 : 503;
    throw serviceError;
  } finally {
    clearTimeout(timeout);
  }
};

export const getVisionLabModels = async () =>
  requestAi("/lab/models", { method: "GET" }, 10000);

export const runVisionLabTest = async ({
  modelId,
  file,
  confidence,
}) => {
  const media = await fs.readFile(uploadDiskPath(file.filename));
  return requestAi("/lab/test", {
    method: "POST",
    body: JSON.stringify({
      modelId,
      media: media.toString("base64"),
      mimeType: file.mimetype || "application/octet-stream",
      fileName: file.originalname || file.filename,
      confidence,
    }),
  });
};
