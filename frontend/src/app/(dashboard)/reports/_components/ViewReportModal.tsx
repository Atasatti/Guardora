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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReport, deleteReport } from "@/lib/actions/reports";
import { Report, ReportStatus } from "@/models";
import { toast } from "sonner";
import { Loader2, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ViewModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (report: Report) => void;
  onDeleted: (id: string) => void;
}

export default function ViewReportModal({
  report,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: ViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [adminNote, setAdminNote] = useState("");

  // Sync state when report opens
  useEffect(() => {
    if (report) {
      setStatus(report.status);
      setAdminNote(report.adminResponse || "");
    }
  }, [report]);

  if (!report) return null;

  const handleSave = async () => {
    setLoading(true);
    const result = await updateReport(report._id, {
      status: status,
      adminResponse: adminNote,
    });

    if (result.success && result.report) {
      toast.success("Report updated successfully");
      onUpdated(result.report);
      onClose();
    } else {
      toast.error(result.message || "Failed to update report");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report log?")) return;
    setIsDeleting(true);
    const result = await deleteReport(report._id);
    if (result.success) {
      toast.success("Report deleted");
      onDeleted(report._id);
      onClose();
    } else {
      toast.error(result.message || "Failed to delete");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Report Details</span>
            <Badge variant="outline" className="ml-2">
              {report.type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(report.createdAt), "PPP p")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. Reporter Section */}
          <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg border">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`${STORAGE_BASE_URL}/${report.reporter?.profilePicture}`}
              />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">
                {report.reporter?.name || "Unknown User"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {report.reporter?.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  Unit {report.reporter?.unitNumber}
                </Badge>
              </div>
            </div>
          </div>

          {/* 2. The Complaint */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Reason for Report</Label>
            <div className="p-3 bg-muted rounded-md text-sm leading-relaxed whitespace-pre-wrap">
              {report.reason}
            </div>
          </div>

          {/* 3. Admin Action Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Admin Resolution</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={status}
                  onValueChange={(v: ReportStatus) => setStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">
                      Reviewed (In Progress)
                    </SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="DISMISSED">
                      Dismissed (Invalid)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Admin Note / Response</Label>
              <Textarea
                placeholder="Add internal notes or response regarding this issue..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                This note is visible to other admins and may be shown to the
                user in future updates.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full gap-2">
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
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Resolution
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
