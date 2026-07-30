import multer from "multer";
import path from "node:path";
import { uploadsDirectory } from "./config/uploads.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalExtension = path.extname(file.originalname).toLowerCase();
    const extensionByMimeType = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
    };
    const extension =
      extensionByMimeType[file.mimetype] || originalExtension || ".bin";
    const filename =
      path
        .basename(file.originalname, originalExtension)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "upload";

    cb(null, `${filename}-${uniqueSuffix}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export default multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG, WebP, GIF, MP4, WebM, and MOV are allowed")
      );
    }
    callback(null, true);
  },
});
