import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import FacilitiesDashboardClient from "./_components/FacilitiesDashboardClient";
import { loadFacilitiesViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function FacilitiesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FacilitiesDataComponent />
    </Suspense>
  );
}

async function FacilitiesDataComponent() {
  const viewModel = await loadFacilitiesViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load facilities"
      />
    );
  }

  return (
    <FacilitiesDashboardClient initialFacilities={viewModel.data.facilities} />
  );
}
