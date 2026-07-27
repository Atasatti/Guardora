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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVisitor } from "@/lib/actions/visitors";
import { VisitorType, CreateVisitorData, Visitor } from "@/models";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (visitor: Visitor) => void;
}

export default function CreateVisitorModal({
  isOpen,
  onClose,
  onCreated,
}: CreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateVisitorData>>({
    name: "",
    phoneNumber: "",
    visitDate: "",
    type: "GUEST",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitDate) {
      toast.error("Please select a visit date");
      return;
    }

    setLoading(true);

    const result = await createVisitor(formData as CreateVisitorData);

    if (result.success && result.visitor) {
      toast.success("Visitor pass created");
      onCreated(result.visitor);
      onClose();
      setFormData({
        name: "",
        phoneNumber: "",
        visitDate: "",
        type: "GUEST",
      });
    } else {
      toast.error(result.message || "Failed to create pass");
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue Visitor Pass</DialogTitle>
          <DialogDescription>
            Create a new entry pass. You will be listed as the host.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Visitor Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              required
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="e.g. 03001234567"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val: VisitorType) =>
                  setFormData({ ...formData, type: val })
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="datetime-local"
                required
                onChange={(e) =>
                  setFormData({ ...formData, visitDate: e.target.value })
                }
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Pass
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
