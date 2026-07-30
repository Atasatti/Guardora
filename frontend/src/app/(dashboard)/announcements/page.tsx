import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import AnnouncementDashboardClient from "./_components/AnnouncementDashboardClient";
import { loadAnnouncementsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function AnnouncementsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnnouncementDataComponent />
    </Suspense>
  );
}

async function AnnouncementDataComponent() {
  const viewModel = await loadAnnouncementsViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load announcements"
      />
    );
  }

  return (
    <AnnouncementDashboardClient
      initialAnnouncements={viewModel.data.announcements}
    />
  );
}
