import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import ModerationDashboardClient from "./_components/ModerationDashboardClient";
import { loadModerationViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function ModerationPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ModerationDataComponent />
    </Suspense>
  );
}

async function ModerationDataComponent() {
  const viewModel = await loadModerationViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load moderation cases"
      />
    );
  }

  return <ModerationDashboardClient initialCases={viewModel.data.cases} />;
}
