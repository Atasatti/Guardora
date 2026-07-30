import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import AdsDashboardClient from "./_components/AdsDashboardClient";
import { loadAdsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function AdsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdsDataComponent />
    </Suspense>
  );
}

async function AdsDataComponent() {
  const viewModel = await loadAdsViewModel();

  if (viewModel.status !== "ready") {
    return <ViewModelError viewModel={viewModel} title="Failed to load ads" />;
  }

  return <AdsDashboardClient initialAds={viewModel.data.ads} />;
}
