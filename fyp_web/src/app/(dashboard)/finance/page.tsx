import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import BillingDashboardClient from "./_components/BillingDashboardClient";
import { loadBillingViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function BillingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BillingDataComponent />
    </Suspense>
  );
}

async function BillingDataComponent() {
  const viewModel = await loadBillingViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load billing data"
      />
    );
  }

  return (
    <BillingDashboardClient
      initialBills={viewModel.data.bills}
      initialStats={viewModel.data.stats}
    />
  );
}
