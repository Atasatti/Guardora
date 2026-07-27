import { Suspense } from "react";
import PageLoader from "../users/_components/PageLoader";
import AlertsClient from "./_components/AlertsClient";
import { loadAlertsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function AlertsPage() {
  const viewModel = await loadAlertsViewModel();

  return (
    <div className="flex flex-col h-full w-full gap-6 p-6">
      <header>
        <h1 className="text-3xl font-bold">Alerts & Banned Persons</h1>
      </header>
      <Suspense fallback={<PageLoader />}>
        {viewModel.status === "ready" ? (
          <AlertsClient
            initialAlerts={viewModel.data.alerts}
            initialBannedPersons={viewModel.data.bannedPersons}
          />
        ) : (
          <ViewModelError viewModel={viewModel} title="Failed to load alerts" />
        )}
      </Suspense>
    </div>
  );
}
