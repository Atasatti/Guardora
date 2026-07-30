import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(configDirectory, "..", "..");

export const uploadsDirectory = path.join(backendDirectory, "uploads");

export const ensureUploadsDirectory = () => {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
};

export const storedUploadPath = (filename, { leadingSlash = false } = {}) => {
  const relativePath = `uploads/${path.basename(filename)}`;
  return leadingSlash ? `/${relativePath}` : relativePath;
};

export const uploadDiskPath = (storedPathOrFilename) => {
  const filename = path.basename(
    String(storedPathOrFilename || "").replaceAll("\\", "/")
  );

  if (!filename) {
    throw new Error("An upload filename is required");
  }

  return path.join(uploadsDirectory, filename);
};

export const removeUploadFile = (storedPathOrFilename) => {
  if (!storedPathOrFilename) return;

  try {
    fs.unlinkSync(uploadDiskPath(storedPathOrFilename));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

ensureUploadsDirectory();
