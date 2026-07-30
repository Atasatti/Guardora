import { Suspense } from "react";
import PageLoader from "../users/_components/PageLoader";
import AlertsClient from "./_components/AlertsClient";
import { loadAlertsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function AlertsPage() {
  const viewModel = await loadAlertsViewModel();

  return (
    <div className="page-stack">
      <header>
        <h1 className="page-title">Alerts & Banned Persons</h1>
        <p className="page-description">
          Review live security events and manage restricted access records.
        </p>
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
