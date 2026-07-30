"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateVisitor, deleteVisitor } from "@/lib/actions/visitors";
import { Visitor, VisitorStatus, VisitorType } from "@/models";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ViewModalProps {
  visitor: Visitor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (visitor: Visitor) => void;
  onDeleted: (id: string) => void;
}

export default function ViewVisitorModal({
  visitor,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: ViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState<Partial<Visitor>>({});

  if (!visitor) return null;

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({
        name: visitor.name,
        type: visitor.type,
        status: visitor.status,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setLoading(true);
    const result = await updateVisitor(visitor._id, editData);
    if (result.success && result.visitor) {
      toast.success("Visitor updated");
      onUpdated(result.visitor);
      setIsEditing(false);
    } else {
      toast.error(result.message || "Failed to update");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this pass?")) return;
    setIsDeleting(true);
    const result = await deleteVisitor(visitor._id);
    if (result.success) {
      toast.success("Visitor pass deleted");
      onDeleted(visitor._id);
      onClose();
    } else {
      toast.error(result.message || "Failed to delete");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-8">
            <span>Visitor Details</span>
            <Badge
              variant={visitor.status === "ACTIVE" ? "default" : "secondary"}
            >
              {visitor.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Pass ID: <span className="font-mono">{visitor._id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg border border-dashed">
            <span className="text-sm text-muted-foreground mb-1">
              Entry Code
            </span>
            <span className="text-3xl font-mono font-bold tracking-wider">
              {visitor.entryCode || "----"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                />
              ) : (
                <div className="font-medium">{visitor.name}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="font-medium">{visitor.phoneNumber}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              {isEditing ? (
                <Select
                  value={editData.type}
                  onValueChange={(val: VisitorType) =>
                    setEditData({ ...editData, type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">Guest</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="DELIVERY">Delivery</SelectItem>
                    <SelectItem value="RIDE">Ride</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium capitalize">
                  {visitor.type.toLowerCase()}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <div className="font-medium">
                {format(new Date(visitor.visitDate), "PPP p")}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editData.status}
                onValueChange={(val: VisitorStatus) =>
                  setEditData({ ...editData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full">
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting || loading}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEditToggle}
              disabled={loading}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {isEditing ? (
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            ) : (
              <Button onClick={onClose}>Close</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
