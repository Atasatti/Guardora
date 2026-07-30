import { Suspense } from "react";
import UserClient from "./_components/UserClient";
import PageLoader from "./_components/PageLoader";
import { loadUsersViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function UserPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <UserManagementComponent />
    </Suspense>
  );
}

async function UserManagementComponent() {
  const viewModel = await loadUsersViewModel();

  if (viewModel.status !== "ready") {
    return <ViewModelError viewModel={viewModel} />;
  }

  return (
    <UserClient
      initialUsers={viewModel.data.users}
      initialReports={viewModel.data.reports}
    />
  );
}
