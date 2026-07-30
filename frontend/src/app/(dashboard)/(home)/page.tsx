import { Suspense } from "react";
import PageLoader from "../users/_components/PageLoader";
import DashboardClient from "./_components/DashboardClient";
import { loadDashboardViewModel } from "@/view-models/admin";

export default async function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardDataComponent />
    </Suspense>
  );
}

async function DashboardDataComponent() {
  const viewModel = await loadDashboardViewModel();
  return <DashboardClient data={viewModel.data} />;
}
