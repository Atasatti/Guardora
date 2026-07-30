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
      type: String, // URL or Base64
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
