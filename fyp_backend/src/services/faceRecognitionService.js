import fs from "node:fs/promises";
import path from "node:path";
import { uploadDiskPath } from "../config/uploads.js";

const serviceUrl = (process.env.AI_SERVICE_URL || "http://127.0.0.1:8001").replace(
  /\/+$/,
  ""
);
const timeoutMs = Number.parseInt(
  process.env.AI_SERVICE_TIMEOUT_MS || "10000",
  10
);

const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const requestAi = async (pathname, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${serviceUrl}${pathname}`, {
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
        payload.detail || payload.message || "Face-recognition request failed"
      );
      error.statusCode = response.status === 422 ? 422 : 502;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error?.statusCode) throw error;

    const serviceError = new Error(
      error?.name === "AbortError"
        ? "Face-recognition service timed out"
        : "Face-recognition service is unavailable"
    );
    serviceError.statusCode = 503;
    throw serviceError;
  } finally {
    clearTimeout(timeout);
  }
};

export const enrollBannedPerson = async ({
  identityId,
  name,
  profilePicture,
}) => {
  const imagePath = uploadDiskPath(profilePicture);
  const image = await fs.readFile(imagePath);
  const extension = path.extname(imagePath).toLowerCase();
  const mimeType = mimeTypes[extension] || "application/octet-stream";

  return requestAi("/gallery/enroll", {
    method: "POST",
    body: JSON.stringify({
      identityId: String(identityId),
      name,
      image: `data:${mimeType};base64,${image.toString("base64")}`,
    }),
  });
};

export const removeBannedPersonFromAi = async (identityId) =>
  requestAi(`/gallery/${encodeURIComponent(String(identityId))}`, {
    method: "DELETE",
  });

