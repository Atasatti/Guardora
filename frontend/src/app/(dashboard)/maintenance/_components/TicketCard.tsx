"use client";

import { MaintenanceTicket, TicketType } from "@/models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  WashingMachine,
  ShowerHead,
  Paintbrush,
  AlertOctagon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Helper to get a unique color and icon for each ticket type
const getTicketTypeVisuals = (type: TicketType) => {
  switch (type) {
    case "ELECTRICITY":
      return {
        icon: Wrench,
        color: "bg-yellow-500",
      };
    case "CLEANING":
      return {
        icon: WashingMachine,
        color: "bg-blue-500",
      };
    case "PLUMBING":
      return {
        icon: ShowerHead,
        color: "bg-cyan-500",
      };
    case "HANDYWORK":
      return {
        icon: Paintbrush,
        color: "bg-orange-500",
      };
    case "OTHER":
    default:
      return {
        icon: AlertOctagon,
        color: "bg-gray-500",
      };
  }
};

export default function TicketCard({
  ticket,
  isDragging,
}: {
  ticket: MaintenanceTicket;
  isDragging: boolean;
}) {
  const { icon: Icon, color } = getTicketTypeVisuals(ticket.type);

  // Format the date to "x days ago"
  const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), {
    addSuffix: true,
  });

  return (
    <Card
      className={`w-full cursor-grab rounded-lg ${
        isDragging ? "ring-2 ring-primary" : "shadow-sm hover:shadow-md"
      } transition-shadow duration-200`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            className={`flex items-center gap-1.5 ${color} hover:${color}`}
          >
            <Icon className="h-3 w-3" />
            <span className="text-xs">{ticket.type}</span>
          </Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="font-semibold text-card-foreground line-clamp-2">
          {ticket.title}
        </p>
      </CardContent>
    </Card>
  );
}
