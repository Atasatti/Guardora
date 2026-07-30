import { Schema, model } from "mongoose";

const maintenanceTicketSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    type: {
      type: String,
      enum: ["ELECTRICITY", "CLEANING", "PLUMBING", "HANDYWORK", "OTHER"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    expectedResolutionAt: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [String],
      default: [],
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "PENDING",
            "ASSIGNED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
          ],
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

maintenanceTicketSchema.index({ requester: 1, createdAt: -1 });
maintenanceTicketSchema.index({ assignedTo: 1, status: 1 });
maintenanceTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

const MaintenanceTicket = model("MaintenanceTicket", maintenanceTicketSchema);

export default MaintenanceTicket;
