import mongoose from "mongoose";

const bannedPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"], // Can be "Unknown" if from camera
    },
    reason: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String, // Legacy on-disk path, retained for records created before
      // enrolment images moved into the database.
    },
    // The enrolment photo is the biometric record: the face embedding is
    // recomputed from it whenever the recognition service starts. Container
    // disks do not survive a restart, so it is stored here instead — a face
    // image is small enough (tens of KB) that the document limit is not a
    // concern, and keeping it beside the record makes re-enrolment possible
    // after any restart.
    imageData: {
      type: Buffer,
      select: false,
    },
    imageMimeType: {
      type: String,
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    sightings: [
      {
        cameraName: {
          type: String,
          required: true,
        },
        confidence: {
          type: Number,
          default: null,
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
        alert: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SecurityAlert",
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

bannedPersonSchema.index({ lastSeenAt: -1 });

export default mongoose.model("BannedPerson", bannedPersonSchema);
