import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import ReportsDashboardClient from "./_components/ReportsDashboardClient";
import { loadReportsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function ReportsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ReportsDataComponent />
    </Suspense>
  );
}

async function ReportsDataComponent() {
  const viewModel = await loadReportsViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load reports" />
    );
  }

  return <ReportsDashboardClient initialReports={viewModel.data.reports} />;
}
