import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import VisitorsDashboardClient from "./_components/VisitorsDashboardClient";
import { loadVisitorsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function VisitorsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VisitorsDataComponent />
    </Suspense>
  );
}

async function VisitorsDataComponent() {
  const viewModel = await loadVisitorsViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load visitors" />
    );
  }

  return <VisitorsDashboardClient initialVisitors={viewModel.data.visitors} />;
}
