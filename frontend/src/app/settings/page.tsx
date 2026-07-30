import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import SettingsClient from "./_components/SettingsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadSettingsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";
import { DashboardShell } from "@/app/_components/dashboard-shell";

export default async function SettingsPage() {
  return (
    <DashboardShell>
      <div className="page-stack mx-auto max-w-5xl">
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Workspace preferences</div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Manage your account and preferences.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft />
            Back to overview
          </Link>
        </Button>
      </header>

      <Suspense fallback={<PageLoader />}>
        <SettingsDataComponent />
      </Suspense>
      </div>
    </DashboardShell>
  );
}

async function SettingsDataComponent() {
  const viewModel = await loadSettingsViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError
        viewModel={viewModel}
        title="Unable to load settings"
      />
    );
  }

  return <SettingsClient user={viewModel.data.user} />;
}
