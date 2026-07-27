import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import SettingsClient from "./_components/SettingsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadSettingsViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <Suspense fallback={<PageLoader />}>
        <SettingsDataComponent />
      </Suspense>
    </div>
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
