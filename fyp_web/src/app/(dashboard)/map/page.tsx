import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import SafetyMapDashboardClient from "./_components/SafetyMapDashboardClient";
import { loadMapViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function SafetyMapPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SafetyMapDataComponent />
    </Suspense>
  );
}

async function SafetyMapDataComponent() {
  const viewModel = await loadMapViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load map data" />
    );
  }

  return <SafetyMapDashboardClient initialAreas={viewModel.data.areas} />;
}
