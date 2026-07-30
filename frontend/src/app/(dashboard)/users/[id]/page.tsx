import { Suspense } from "react";
import UserProfileClient from "../_components/UserProfileClient";
import PageLoader from "../_components/PageLoader";
import { loadUserProfileViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageLoader />}>
      <UserProfileComponent userId={id} />
    </Suspense>
  );
}

async function UserProfileComponent({ userId }: { userId: string }) {
  const viewModel = await loadUserProfileViewModel(userId);
  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Failed to load user profile"
      />
    );
  }

  return (
    <UserProfileClient
      user={viewModel.data.user}
      posts={viewModel.data.posts}
      products={viewModel.data.products}
    />
  );
}
