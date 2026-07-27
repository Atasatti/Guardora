"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateMaintenanceTicket,
  deleteMaintenanceTicket,
} from "@/lib/actions";
import { MaintenanceTicket, TICKET_STATUSES, TicketStatus } from "@/models";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ViewTicketModal({
  ticket,
  isOpen,
  onClose,
  onTicketUpdated,
  onTicketDeleted,
}: {
  ticket: MaintenanceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: (updatedTicket: MaintenanceTicket) => void;
  onTicketDeleted: (deletedTicketId: string) => void;
}) {
  const [currentStatus, setCurrentStatus] = useState<TicketStatus | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  // When the modal opens (i.e., 'ticket' prop changes),
  // set the internal state to match the selected ticket.
  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status);
    }
  }, [ticket]);

  if (!ticket) {
    return null; // Don't render anything if no ticket is selected
  }

  const handleUpdateStatus = async () => {
    if (currentStatus === ticket.status) {
      // No change, just close the modal
      handleClose();
      return;
    }
    setIsLoading(true);

    toast.promise(
      updateMaintenanceTicket(ticket._id, { status: currentStatus }),
      {
        loading: "Updating status...",
        success: (res) => {
          if (res!.success) {
            if (res!.ticket) {
              onTicketUpdated(res!.ticket);
              handleClose();
              return "Ticket status updated!";
            } else {
              handleClose();
              return "Some Error Occurred!";
            }
          } else {
            throw new Error(res!.message);
          }
        },
        error: (err) => {
          setIsLoading(false);
          return `Failed to update: ${err.message}`;
        },
      }
    );
  };

  const handleDeleteTicket = async () => {
    setIsLoading(true);

    toast.promise(deleteMaintenanceTicket(ticket._id), {
      loading: "Deleting ticket...",
      success: (res) => {
        if (res!.success) {
          onTicketDeleted(ticket._id); // Remove from local state
          handleClose(); // Close modal
          return "Ticket successfully deleted!";
        } else {
          throw new Error(res!.message);
        }
      },
      error: (err) => {
        setIsLoading(false);
        return `Failed to delete: ${err.message}`;
      },
    });
  };

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  // Helper to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM, yyyy 'at' h:mm a");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-10 line-clamp-2">
            {ticket.title}
          </DialogTitle>
          <DialogDescription>
            Ticket Type: {ticket.type} | Created: {formatDate(ticket.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* --- View Description --- */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Description
            </Label>
            <p
              id="description"
              className="text-sm p-3 bg-muted rounded-md h-32 overflow-y-auto"
            >
              {ticket.description}
            </p>
          </div>

          {/* --- Change Status --- */}
          <div className="space-y-2">
            <Label htmlFor="status" className="font-semibold">
              Status
            </Label>
            <Select
              value={currentStatus}
              onValueChange={(value) => setCurrentStatus(value as TicketStatus)}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {/* Make it title-cased for readability */}
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
          {/* --- Delete Button (with confirmation) --- */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  maintenance ticket.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTicket}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, delete ticket
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* --- Main Save/Close Buttons --- */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
