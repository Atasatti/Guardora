import crypto from "crypto";
import ErrorHandler from "../utils/ErrorHandler.js";

const buckets = new Map();

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20 } = {}) => {
  return (req, res, next) => {
    const forwarded = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    const identity = forwarded || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${identity}:${req.baseUrl}:${req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);
    const bucket =
      existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(max - bucket.count, 0));
    res.setHeader(
      "RateLimit-Reset",
      Math.ceil((bucket.resetAt - now) / 1000)
    );
    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return next(
        new ErrorHandler("Too many requests. Please try again later.", 429)
      );
    }
    next();
  };
};

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("X-Request-Id", req.get("x-request-id") || crypto.randomUUID());
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  next();
};

const verifyBrowserOrigin = (allowedOrigins) => (req, res, next) => {
  if (
    process.env.NODE_ENV !== "production" ||
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.get("authorization")
  ) {
    return next();
  }
  const origin = req.get("origin");
  if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    return next();
  }
  return next(new ErrorHandler("Untrusted request origin", 403));
};

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 15 * 60 * 1000);
cleanupTimer.unref();

export { rateLimit, securityHeaders, verifyBrowserOrigin };
