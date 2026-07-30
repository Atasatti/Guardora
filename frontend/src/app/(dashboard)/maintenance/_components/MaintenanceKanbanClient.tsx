"use client";

import { useState } from "react";
import { DragDropContext, OnDragEndResponder } from "@hello-pangea/dnd";
import { MaintenanceTicket, TicketStatus } from "@/models";
import { updateMaintenanceTicket } from "@/lib/actions";
import { toast } from "sonner";
import KanbanColumn from "./KanbanColumn";
import ViewTicketModal from "./ViewTicketModal";

// Define the order and titles for our columns
const COLUMN_IDS: TicketStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];
const COLUMN_NAMES: Record<TicketStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function MaintenanceKanbanClient({
  initialTickets,
}: {
  initialTickets: MaintenanceTicket[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null);

  const columns = COLUMN_IDS.reduce((acc, status) => {
    acc[status] = tickets.filter((ticket) => ticket.status === status);
    return acc;
  }, {} as Record<TicketStatus, MaintenanceTicket[]>);

  const onDragEnd: OnDragEndResponder = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const movedTicket = tickets.find((t) => t._id === draggableId);
    if (!movedTicket) return;

    const newStatus = destination.droppableId as TicketStatus;
    const oldStatus = source.droppableId as TicketStatus;

    // 1. Optimistic UI Update: Move the ticket instantly in the state
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === draggableId ? { ...ticket, status: newStatus } : ticket
      )
    );

    // 2. Call Server Action
    toast.promise(updateMaintenanceTicket(draggableId, { status: newStatus }), {
      loading: "Updating ticket status...",

      success: (res) => {
        if (res && res.success === true) {
          // Update local state with the confirmed data from the server
          setTickets((prev) =>
            prev.map((t) =>
              res.ticket && t._id === res.ticket._id ? res.ticket : t
            )
          );
          return `Ticket moved to ${COLUMN_NAMES[newStatus]}`;
        }

        if (res && res.success === false) {
          throw new Error(res.message);
        }

        throw new Error("Invalid response from server.");
      },

      error: (err: Error) => {
        // Rollback on failure: Move the ticket back to its original column
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === draggableId
              ? { ...ticket, status: oldStatus }
              : ticket
          )
        );

        if (err.message.includes("NEXT_REDIRECT")) {
          return "Authentication expired. Redirecting to login...";
        }

        return `Failed to update ticket: ${err.message}`;
      },
    });
  };

  return (
    <>
      <div className="page-stack">
        {/* --- Header --- */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Maintenance Kanban Board</h1>
            <p className="page-description">
              Drag and drop tickets to update their status
            </p>
          </div>
        </header>

        {/* --- Kanban Board --- */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {COLUMN_IDS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                title={COLUMN_NAMES[status]}
                tickets={columns[status]}
                onCardClick={setSelectedTicket}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* --- View/Update Modal --- */}
      <ViewTicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updatedTicket) => {
          setTickets((prev) =>
            prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
          );
        }}
        onTicketDeleted={(deletedTicketId) => {
          setTickets((prev) => prev.filter((t) => t._id !== deletedTicketId));
        }}
      />
    </>
  );
}
