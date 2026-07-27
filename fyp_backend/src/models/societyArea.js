import mongoose from "mongoose";

const societyAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mapId: {
      type: String,
      required: true,
      unique: true,
      enum: ["block_a", "block_b", "block_c", "central_park"],
    },
    isSafe: {
      type: Boolean,
      default: true,
    },
    cctvIndex: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SocietyArea", societyAreaSchema);
