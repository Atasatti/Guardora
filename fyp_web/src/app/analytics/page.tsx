import { Suspense } from "react";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import AnalyticsClient from "./_components/AnalyticsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadAnalyticsViewModel } from "@/view-models/admin";

export default async function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed trends and historical data analysis.
          </p>
        </div>
      </div>

      <Suspense fallback={<PageLoader />}>
        <AnalyticsDataComponent />
      </Suspense>
    </div>
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
