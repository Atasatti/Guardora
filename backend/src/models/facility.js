import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
    },
    availableCapacity: {
      type: Number,
      required: true,
    },
    isPaidService: {
      type: Boolean,
      required: true,
    },
    pricePerHour: {
      type: Number,
      default: null, // Optional
    },
    rules: {
      type: [String],
      required: true,
    },
    openTime: {
      type: String,
      required: true,
      // Format as "HH:mm" or store as Date if needed
    },
    closeTime: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Facility = mongoose.model("Facility", facilitySchema);

export default Facility;
