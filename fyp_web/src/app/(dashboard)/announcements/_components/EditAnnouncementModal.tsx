"use client";

import { useEffect, useState } from "react";
import { updateAnnouncement, deleteAnnouncement } from "@/lib/actions";
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
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (item: Announcement) => void;
  onDeleted: (id: string) => void;
}

export default function EditAnnouncementModal({
  announcement,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isUrgent: false,
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        description: announcement.description,
        isUrgent: announcement.isUrgent,
      });
    }
  }, [announcement]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;

    setLoading(true);
    try {
      const res = await updateAnnouncement(announcement._id, formData);
      if (res.success) {
        onUpdated({ ...announcement, ...formData });
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

  const handleDelete = async () => {
    if (!announcement || !confirm("Are you sure you want to delete this?"))
      return;

    setIsDeleting(true);
    try {
      const res = await deleteAnnouncement(announcement._id);
      if (res.success) {
        onDeleted(announcement._id);
        onClose();
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update details or remove this announcement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-urgent"
              checked={formData.isUrgent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isUrgent: checked as boolean })
              }
            />
            <Label htmlFor="edit-urgent" className="font-normal cursor-pointer">
              Mark as Urgent/Emergency
            </Label>
          </div>

          <DialogFooter className="flex sm:justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || loading}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isDeleting}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
