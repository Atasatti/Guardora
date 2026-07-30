import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import MaintenanceDashboardClient from "./_components/MaintenanceDashboardClient";
import { loadMaintenanceViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function MaintenancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MaintenanceDataComponent />
    </Suspense>
  );
}

async function MaintenanceDataComponent() {
  const viewModel = await loadMaintenanceViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load tickets" />
    );
  }

  return (
    <MaintenanceDashboardClient initialTickets={viewModel.data.tickets} />
  );
}
