"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteFacility } from "@/lib/actions";
import { Facility } from "@/models";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import FacilityModalTabs from "./FacilityModalTabs";
import FacilityDetailsTab from "./FacilityDetailsTab";
import FacilityReservationsTab from "./FacilityReservationsTab";
import DeleteFacilityButton from "./DeleteFacilityButton";

interface ViewFacilityModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onFacilityUpdated: (updatedFacility: Facility) => void;
  onFacilityDeleted: (deletedFacilityId: string) => void;
}

export default function ViewFacilityModal({
  facility,
  isOpen,
  onClose,
  onFacilityUpdated,
  onFacilityDeleted,
}: ViewFacilityModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "reservations">(
    "details"
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFacility = async () => {
    if (!facility) return;

    setIsDeleting(true);
    const result = await deleteFacility(facility._id);
    if (result!.success) {
      onFacilityDeleted(facility._id);
      onClose();
      toast.success("Facility deleted successfully!");
    } else {
      toast.error(`Failed to delete facility: ${result!.message}`);
    }
    setIsDeleting(false);
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!facility) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{facility.name}</span>
            <Badge variant={facility.isPaidService ? "default" : "secondary"}>
              {facility.isPaidService
                ? `$${facility.pricePerHour}/hour`
                : "Free"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Manage facility details and view reservations.
          </DialogDescription>
        </DialogHeader>

        <FacilityModalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          reservationsCount={0} // You can pass actual count if available
        />

        <div className="min-h-[400px]">
          {activeTab === "details" ? (
            <FacilityDetailsTab
              facility={facility}
              onFacilityUpdated={onFacilityUpdated}
            />
          ) : (
            <FacilityReservationsTab facilityId={facility._id} />
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <DeleteFacilityButton
            onDelete={handleDeleteFacility}
            disabled={isDeleting}
          />

          {activeTab === "details" && (
            <Button
              onClick={() => {
                /* Save logic is now inside FacilityDetailsTab */
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
