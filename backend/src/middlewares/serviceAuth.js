import crypto from "node:crypto";
import ErrorHandler from "../utils/ErrorHandler.js";

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const requireAiServiceKey = (req, res, next) => {
  const configuredKey = process.env.AI_SERVICE_API_KEY;
  if (!configuredKey && process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!configuredKey) {
    return next(new ErrorHandler("AI service authentication is not configured", 503));
  }

  const suppliedKey = req.get("x-ai-service-key");
  if (!safeEqual(configuredKey, suppliedKey)) {
    return next(new ErrorHandler("Invalid AI service credentials", 401));
  }
  next();
};
