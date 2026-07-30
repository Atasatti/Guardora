// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ["PRODUCT", "SERVICE"],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  itemTitle: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  images: [{
    type: String,
  }],
  serviceType: {
    type: String,
    enum: ["ONE_TIME", "RECURRING"],
  },
  scheduledDate: {
    type: Date,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "COMPLETED"],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE"],
      default: "CASH",
    },
    shippingAddress: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
    if (this.isNew && !this.orderNumber) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.orderNumber = `ORD-${timestamp}-${random}`;
    }
    next();
  });

orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "DELIVERED" && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
    if (this.status === "COMPLETED" && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status === "CANCELLED" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

export default mongoose.model("Order", orderSchema);