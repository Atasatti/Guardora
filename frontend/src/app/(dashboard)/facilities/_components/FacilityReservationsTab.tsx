"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getReservationsByFacility, deleteReservation } from "@/lib/actions";
import { Reservation } from "@/models";
import { toast } from "sonner";
import { Loader2, Calendar, User, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface FacilityReservationsTabProps {
  facilityId: string;
}

export default function FacilityReservationsTab({
  facilityId,
}: FacilityReservationsTabProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    const result = await getReservationsByFacility(facilityId);
    if (result.success) {
      setReservations(result.reservations || []);
    } else {
      toast.error(`Failed to load reservations: ${result.message}`);
    }
    setIsLoading(false);
  }, [facilityId]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const handleDeleteReservation = async (reservationId: string) => {
    const result = await deleteReservation(reservationId);
    if (result!.success) {
      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
      toast.success("Reservation deleted successfully!");
    } else {
      toast.error(`Failed to delete reservation: ${result!.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reservation History</h3>
        <Badge variant="outline">Total: {reservations.length}</Badge>
      </div>

      {reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation._id}
              reservation={reservation}
              onDelete={handleDeleteReservation}
            />
          ))}
        </div>
      ) : (
        <EmptyReservationsState />
      )}
    </div>
  );
}

// Sub-component for individual reservation card
function ReservationCard({
  reservation,
  onDelete,
}: {
  reservation: Reservation;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(reservation.date), "PPP 'at' p")}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{reservation.durationInHours} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Resident ID: {reservation.residentId}</span>
              </div>
            </div>
          </div>
          <DeleteReservationButton
            reservationId={reservation._id}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component for delete button with confirmation
function DeleteReservationButton({
  reservationId,
  onDelete,
}: {
  reservationId: string;
  onDelete: (id: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this reservation? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(reservationId)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Sub-component for empty state
function EmptyReservationsState() {
  return (
    <div className="text-center py-8 border-2 border-dashed rounded-lg">
      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg mb-2">No Reservations</h3>
      <p className="text-muted-foreground">
        This facility doesn&apos;t have any reservations yet.
      </p>
    </div>
  );
}
