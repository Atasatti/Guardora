"use client";

import { useState } from "react";
import { Announcement } from "@/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Plus, AlertCircle } from "lucide-react";
import AnnouncementDataTable from "./AnnouncementDataTable";
import { columns } from "./AnnouncementTableColumns";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import EditAnnouncementModal from "./EditAnnouncementModal";
import { pinAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";

interface AnnouncementDashboardClientProps {
  initialAnnouncements: Announcement[];
}

export default function AnnouncementDashboardClient({
  initialAnnouncements,
}: AnnouncementDashboardClientProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Stats
  const totalAnnouncements = announcements.length;
  const urgentAnnouncements = announcements.filter((a) => a.isUrgent).length;
  const activePolls = announcements.filter((a) => a.kind === "POLL").length;

  // Handlers
  const handleCreated = (newItem: Announcement) => {
    setAnnouncements((prev) => [newItem, ...prev]);
  };

  const handleUpdated = (updatedItem: Announcement) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const handleDeleted = (id: string) => {
    setAnnouncements((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <>
      <div className="page-stack">
        {/* --- Header --- */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Announcements</h1>
            <p className="page-description">
              Broadcast news and urgent alerts to residents
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        </header>

        {/* --- Stat Cards --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Posted
              </CardTitle>
              <Megaphone className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAnnouncements}</div>
              <p className="text-xs text-muted-foreground">
                Active announcements
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resident Polls</CardTitle>
              <Megaphone className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePolls}</div>
              <p className="text-xs text-muted-foreground">
                Polls available for voting
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Urgent Alerts
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentAnnouncements}</div>
              <p className="text-xs text-muted-foreground">
                High priority notifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Data Table --- */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementDataTable
              columns={columns({
                onEdit: setSelectedAnnouncement,
                onDelete: setSelectedAnnouncement,
                onPin: async (item) => {
                  const result = await pinAnnouncement(
                    item._id,
                    !item.isPinned
                  );
                  if (result.success) {
                    handleUpdated(result.announcement);
                    toast.success(
                      result.announcement.isPinned
                        ? "Announcement pinned"
                        : "Announcement unpinned"
                    );
                  } else {
                    toast.error(result.message);
                  }
                },
              })}
              data={announcements}
            />
          </CardContent>
        </Card>
      </div>

      {/* --- Modals --- */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditAnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
}
