"use client";

import { useState } from "react";
import { createAnnouncement } from "@/lib/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Announcement } from "@/models";
import { Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: Announcement) => void;
}

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isUrgent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: The server action might return 'message' but we'll rely on revalidatePath
      // for data consistency, and here manually update UI for speed.
      // However, createAnnouncement returns { success, message }.
      // Ideally, you'd fetch the new item, but for now let's assume the page revalidates
      // or you adjust your action to return the new object.
      // *Recommendation*: Adjust `createAnnouncement` in backend to return the object data
      // inside `result.data`.

      const res = await createAnnouncement(formData);

      if (res.success) {
        // Since we didn't return the object from the action wrapper in the previous step,
        // we will do a quick page reload OR you can update your action to return 'data'.
        // For now, let's close and let revalidatePath handle it,
        // or construct a temporary object for optimistic UI:
        onCreated({
          _id: Math.random().toString(), // Temp ID until refresh
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setFormData({ title: "", description: "", isUrgent: false });
        onClose();
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Notify residents about important events or updates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Water Maintenance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter the full details..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgent"
              checked={formData.isUrgent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isUrgent: checked as boolean })
              }
            />
            <Label htmlFor="urgent" className="font-normal cursor-pointer">
              Mark as Urgent/Emergency
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Announcement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
