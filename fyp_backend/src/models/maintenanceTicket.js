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
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      required: true,
    },
    type: {
      type: String,
      enum: ["ELECTRICITY", "CLEANING", "PLUMBING", "HANDYWORK", "OTHER"],
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const MaintenanceTicket = model("MaintenanceTicket", maintenanceTicketSchema);

export default MaintenanceTicket;
