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
    kind: "ANNOUNCEMENT" as "ANNOUNCEMENT" | "POLL",
    commentsEnabled: true,
    pollOptionsText: "",
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

      const res = await createAnnouncement({
        title: formData.title,
        description: formData.description,
        isUrgent: formData.isUrgent,
        kind: formData.kind,
        commentsEnabled: formData.commentsEnabled,
        pollOptions:
          formData.kind === "POLL"
            ? formData.pollOptionsText
                .split("\n")
                .map((text) => ({ text: text.trim() }))
                .filter((option) => option.text)
            : [],
      });

      if (res.success && res.announcement) {
        onCreated(res.announcement);

        setFormData({
          title: "",
          description: "",
          isUrgent: false,
          kind: "ANNOUNCEMENT",
          commentsEnabled: true,
          pollOptionsText: "",
        });
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
            <Label htmlFor="kind">Type</Label>
            <select
              id="kind"
              value={formData.kind}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  kind: event.target.value as "ANNOUNCEMENT" | "POLL",
                })
              }
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="POLL">Resident poll</option>
            </select>
          </div>

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

          {formData.kind === "POLL" && (
            <div className="space-y-2">
              <Label htmlFor="pollOptions">Poll options</Label>
              <Textarea
                id="pollOptions"
                required
                value={formData.pollOptionsText}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    pollOptionsText: event.target.value,
                  })
                }
                placeholder={"One option per line\nOption A\nOption B"}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter at least two options, one per line.
              </p>
            </div>
          )}

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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="commentsEnabled"
              checked={formData.commentsEnabled}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  commentsEnabled: checked === true,
                })
              }
            />
            <Label
              htmlFor="commentsEnabled"
              className="cursor-pointer font-normal"
            >
              Allow resident comments
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
              {formData.kind === "POLL" ? "Publish Poll" : "Post Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
