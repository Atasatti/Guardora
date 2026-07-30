"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { MaintenanceTicket, TicketStatus } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TicketCard from "./TicketCard";

export default function KanbanColumn({
  status,
  title,
  tickets,
  onCardClick,
}: {
  status: TicketStatus;
  title: string;
  tickets: MaintenanceTicket[];
  onCardClick: (ticket: MaintenanceTicket) => void;
}) {
  const getStatusBadge = () => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-orange-500 border-orange-500"
          >
            {tickets.length}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            {tickets.length}
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            {tickets.length}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{tickets.length}</Badge>;
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full">
      {/* --- Column Header --- */}
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      {/* --- Droppable Area --- */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-4 pt-0 space-y-4 rounded-b-lg ${
              snapshot.isDraggingOver ? "bg-muted/50" : "bg-background"
            } transition-colors duration-200`}
          >
            {/* --- List of Tickets --- */}
            {tickets.length > 0 ? (
              tickets.map((ticket, index) => (
                <Draggable
                  key={ticket._id}
                  draggableId={ticket._id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onCardClick(ticket)}
                      className="mt-2"
                    >
                      <TicketCard
                        ticket={ticket}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            ) : (
              // Placeholder when column is empty
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md mt-2">
                <p className="text-sm text-muted-foreground">No tickets</p>
              </div>
            )}
            {provided.placeholder}
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}
