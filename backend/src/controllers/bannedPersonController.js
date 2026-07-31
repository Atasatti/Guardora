import fs from "node:fs/promises";
import BannedPerson from "../models/bannedPerson.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { removeUploadFile, uploadDiskPath } from "../config/uploads.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import {
  enrollBannedPerson,
  removeBannedPersonFromAi,
} from "../services/faceRecognitionService.js";
import { recordAudit } from "../utils/audit.js";

// Get All
export const getBannedPersons = catchAsyncErrors(async (req, res, next) => {
  const persons = await BannedPerson.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, persons });
});

// The stored image is a biometric record, so it is never included in list or
// create responses; callers fetch it from the dedicated image route instead.
const withoutImage = (person) => {
  const plain = person.toObject ? person.toObject() : { ...person };
  delete plain.imageData;
  return plain;
};

export const addBannedPerson = catchAsyncErrors(async (req, res, next) => {
  const name = String(req.body.name || "").trim();
  const reason = String(req.body.reason || "").trim();
  const uploadedFilename = req.file?.filename || null;

  if (!name || !reason || !uploadedFilename) {
    if (uploadedFilename) removeUploadFile(uploadedFilename);
    return next(
      new ErrorHandler(
        "Name, reason, and a clear enrollment photo are required",
        400
      )
    );
  }

  // Read the upload into the record. The container disk is wiped on every
  // restart, and this image is what the recognition gallery is rebuilt from,
  // so the bytes have to outlive the filesystem.
  const imageData = await fs.readFile(uploadDiskPath(uploadedFilename));
  const imageMimeType = req.file.mimetype || "application/octet-stream";

  const person = new BannedPerson({
    name,
    reason,
    imageData,
    imageMimeType,
    addedBy: req.user?._id || "68dbdd492b2ee177716740c3",
  });

  let enrolled = false;
  try {
    await enrollBannedPerson({
      identityId: person._id,
      name: person.name,
      imageData,
      imageMimeType,
    });
    enrolled = true;
    await person.save();
    await recordAudit({
      req,
      action: "BANNED_PERSON_ENROLLED",
      targetModel: "BannedPerson",
      targetId: person._id,
      details: { name: person.name, reason: person.reason },
    });
  } catch (error) {
    if (enrolled) {
      await removeBannedPersonFromAi(person._id).catch(() => {});
    }
    return next(error);
  } finally {
    // The upload was only ever a staging step.
    removeUploadFile(uploadedFilename);
  }

  res.status(201).json({
    success: true,
    person: withoutImage(person),
    message: "Person added and enrolled in live face recognition",
  });
});

export const getBannedPersonImage = catchAsyncErrors(async (req, res, next) => {
  const person = await BannedPerson.findById(req.params.id).select(
    "+imageData imageMimeType"
  );
  if (!person?.imageData) {
    return next(new ErrorHandler("Enrollment image not found", 404));
  }
  res.setHeader(
    "Content-Type",
    person.imageMimeType || "application/octet-stream"
  );
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(person.imageData);
});

// Rebuilds the recognition gallery from the database. This is the recovery
// path after the AI service restarts and loses its in-container gallery.
export const syncBannedPersons = catchAsyncErrors(async (req, res) => {
  const persons = await BannedPerson.find({
    $or: [
      { imageData: { $exists: true, $ne: null } },
      { profilePicture: { $exists: true, $nin: [null, ""] } },
    ],
  }).select("+imageData");
  const synced = [];
  const failed = [];

  for (const person of persons) {
    try {
      await enrollBannedPerson({
        identityId: person._id,
        name: person.name,
        imageData: person.imageData,
        imageMimeType: person.imageMimeType,
        profilePicture: person.profilePicture,
      });
      synced.push({ id: person._id, name: person.name });
    } catch (error) {
      failed.push({
        id: person._id,
        name: person.name,
        message: error.message,
      });
    }
  }

  res.status(failed.length ? 207 : 200).json({
    success: failed.length === 0,
    synced,
    failed,
  });
});

// Unban (Delete)
export const unbanPerson = catchAsyncErrors(async (req, res, next) => {
  const person = await BannedPerson.findById(req.params.id);
  if (!person) {
    return res
      .status(404)
      .json({ success: false, message: "Person not found" });
  }

  await removeBannedPersonFromAi(person._id);
  removeUploadFile(person.profilePicture);
  await person.deleteOne();
  await recordAudit({
    req,
    action: "BANNED_PERSON_REMOVED",
    targetModel: "BannedPerson",
    targetId: person._id,
    details: { name: person.name },
  });
  res.status(200).json({
    success: true,
    message: "Person unbanned and removed from face recognition",
  });
});

export const getBannedPersonTimeline = catchAsyncErrors(
  async (req, res, next) => {
    const person = await BannedPerson.findById(req.params.id).select(
      "name profilePicture lastSeenAt sightings"
    );
    if (!person) return next(new ErrorHandler("Person not found", 404));
    const timeline = [...person.sightings].sort(
      (left, right) => new Date(right.seenAt) - new Date(left.seenAt)
    );
    res.json({
      success: true,
      person: {
        id: person._id,
        name: person.name,
        profilePicture: person.profilePicture,
        lastSeenAt: person.lastSeenAt,
      },
      timeline,
    });
  }
);
