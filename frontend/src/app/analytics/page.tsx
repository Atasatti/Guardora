import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import AnalyticsClient from "./_components/AnalyticsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadAnalyticsViewModel } from "@/view-models/admin";
import { DashboardShell } from "@/app/_components/dashboard-shell";

export default async function AnalyticsPage() {
  return (
    <DashboardShell>
      <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Performance intelligence</div>
          <h1 className="page-title">System Analytics</h1>
          <p className="page-description">
            Detailed trends and historical data analysis.
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
        <AnalyticsDataComponent />
      </Suspense>
      </div>
    </DashboardShell>
  );
}

async function AnalyticsDataComponent() {
  const viewModel = await loadAnalyticsViewModel();

  return (
    <AnalyticsClient
      visitors={viewModel.data.visitors}
      tickets={viewModel.data.tickets}
      alerts={viewModel.data.alerts}
    />
  );
}
