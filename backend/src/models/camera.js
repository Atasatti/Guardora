import mongoose from "mongoose";

const cameraSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyArea",
      default: null,
    },
    sourceType: {
      type: String,
      enum: ["RTSP", "HTTP_STREAM"],
      default: "RTSP",
    },
    encryptedSource: {
      type: String,
      required: true,
      select: false,
    },
    enabled: { type: Boolean, default: true, index: true },
    aiAnalysisEnabled: { type: Boolean, default: true },
    lastOnlineAt: { type: Date, default: null },
    lastError: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true }
);

cameraSchema.index({ area: 1, enabled: 1 });

cameraSchema.set("toJSON", {
  transform: (_document, value) => {
    delete value.encryptedSource;
    value.sourceConfigured = true;
    return value;
  },
});

export default mongoose.model("Camera", cameraSchema);
