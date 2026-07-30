import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import MaintenanceKanbanClient from "../_components/MaintenanceKanbanClient";
import { loadMaintenanceViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function MaintenanceBoardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MaintenanceBoardDataComponent />
    </Suspense>
  );
}

async function MaintenanceBoardDataComponent() {
  const viewModel = await loadMaintenanceViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load tickets" />
    );
  }

  return <MaintenanceKanbanClient initialTickets={viewModel.data.tickets} />;
}
