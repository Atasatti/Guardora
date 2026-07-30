import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import SocialDashboardClient from "./_components/SocialDashboardClient";
import { loadSocialViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function SocialPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SocialDataComponent />
    </Suspense>
  );
}

async function SocialDataComponent() {
  const viewModel = await loadSocialViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load social data"
      />
    );
  }

  return (
    <SocialDashboardClient
      initialPosts={viewModel.data.posts}
      initialProducts={viewModel.data.products}
    />
  );
}
