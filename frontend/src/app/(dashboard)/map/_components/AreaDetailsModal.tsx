"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SocietyArea } from "@/models";
import { updateAreaStatus } from "@/lib/actions/areas";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  area: SocietyArea | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (area: SocietyArea) => void;
}

export default function AreaDetailsModal({
  area,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!area) return null;

  const handleToggleStatus = async () => {
    setLoading(true);
    const newStatus = !area.isSafe;
    const res = await updateAreaStatus(area._id, newStatus);

    if (res.success && res.area) {
      toast.success(`Area marked as ${newStatus ? "Safe" : "Unsafe"}`);
      onUpdated(res.area);
      onClose();
    } else {
      toast.error(res.message || "Failed to update status");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {area.name}
            <Badge
              variant={area.isSafe ? "default" : "destructive"}
              className={area.isSafe ? "bg-green-600" : ""}
            >
              {area.isSafe ? "Secure" : "Hazard Detected"}
            </Badge>
          </DialogTitle>
          <DialogDescription>{area.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full border">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Linked Camera</p>
                <p className="text-xs text-muted-foreground">
                  CCTV Feed #{area.cctvIndex}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              View Feed
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Safety Control</h4>
            <p className="text-xs text-muted-foreground">
              Toggle this switch if a security threat is reported or resolved in
              this sector. Changing this will update the map for all residents
              immediately.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={area.isSafe ? "destructive" : "default"}
            className={!area.isSafe ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {area.isSafe ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" /> Mark as Unsafe
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" /> Mark as Safe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
