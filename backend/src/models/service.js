import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'UNAVAILABLE', 'DELETED'],
    default: 'AVAILABLE'
  },
  serviceType: {
    type: String,
    enum: ['ONE_TIME', 'RECURRING'],
    default: 'ONE_TIME'
  },
  duration: {
    type: String, // e.g., "1 hour", "30 minutes", "Ongoing"
    required: true
  },
}, {
  timestamps: true
});

export default mongoose.model("Service", serviceSchema);