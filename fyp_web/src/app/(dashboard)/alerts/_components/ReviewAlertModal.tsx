"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecurityAlert } from "@/models";

export default function ReviewAlertModal({
  alert,
  isOpen,
  onClose,
  onReview,
  onDismiss,
}: {
  alert: SecurityAlert;
  isOpen: boolean;
  onClose: () => void;
  onReview: (id: string, notes: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = () => {
    setIsSubmitting(true);
    onReview(alert._id, notes);
    setIsSubmitting(false);
  };

  const handleDismiss = () => {
    setIsSubmitting(true);
    onDismiss(alert._id);
    setIsSubmitting(false);
  };

  // Handle Image Source (Base64 from backend vs Mock URL)
  const imageSrc = alert.snapshotBase64
    ? `data:image/jpeg;base64,${alert.snapshotBase64}`
    : alert.snapshotUrl || "/placeholder.png";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Review Alert: {alert.type.replace("_", " ")}
          </DialogTitle>
          <DialogDescription>
            {alert.cameraName} at {new Date(alert.timestamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Snapshot Image */}
          <div className="space-y-2">
            <Label>Snapshot</Label>
            <div className="border rounded-md bg-black/5 overflow-hidden flex items-center justify-center h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Alert snapshot"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Review Notes */}
          <div className="space-y-2 flex flex-col">
            <div className="flex-1">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., 'False alarm, just a glare' or 'Dispatched security.'"
                className="h-[200px] mt-2"
                disabled={alert.status !== "NEW" || isSubmitting}
              />
            </div>

            {/* Details Box */}
            {alert.details && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                <p>
                  <strong>Object:</strong> {alert.details.object}
                </p>
                <p>
                  <strong>Confidence:</strong>{" "}
                  {((alert.details.confidence || 0) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {alert.status === "NEW" && (
            <>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleDismiss}
                disabled={isSubmitting}
              >
                Dismiss (False Alarm)
              </Button>
              <Button
                variant="destructive"
                onClick={handleReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm Threat"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
