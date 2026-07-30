import crypto from "node:crypto";
import ErrorHandler from "./ErrorHandler.js";

const encryptionKey = () => {
  const source =
    process.env.CAMERA_ENCRYPTION_KEY || process.env.JWT_SECRET_KEY || "";
  if (process.env.NODE_ENV === "production" && source.length < 32) {
    throw new ErrorHandler(
      "Camera encryption is not securely configured",
      503
    );
  }
  if (!source) {
    throw new ErrorHandler("Camera encryption is not configured", 503);
  }
  return crypto.createHash("sha256").update(source).digest();
};

const encryptCameraSource = (sourceUrl) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(sourceUrl), "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
};

const decryptCameraSource = (payload) => {
  const [ivValue, tagValue, encryptedValue] = String(payload || "").split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new ErrorHandler("Camera source is invalid", 500);
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

export { encryptCameraSource, decryptCameraSource };
