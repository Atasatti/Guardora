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
  },
  { timestamps: true }
);

export default mongoose.model("BannedPerson", bannedPersonSchema);
