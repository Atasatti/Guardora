"use client";

import { useState } from "react";
import { Ad } from "@/models";
import { updateAdStatus } from "@/lib/actions/ads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, MousePointerClick, Clock } from "lucide-react";
import MaintenanceDataTable from "../../maintenance/_components/MaintenanceDataTable";
import { columns } from "./AdsColumns";
import { toast } from "sonner";

export default function AdsDashboardClient({
  initialAds,
}: {
  initialAds: Ad[];
}) {
  const [ads, setAds] = useState(initialAds);

  const activeAds = ads.filter((a) => a.status === "ACTIVE").length;
  const pendingAds = ads.filter((a) => a.status === "PENDING").length;
  const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);

  const handleStatusChange = async (
    id: string,
    status: "ACTIVE" | "REJECTED"
  ) => {
    const result = await updateAdStatus(id, { status });
    if (result.success) {
      toast.success(result.message);
      setAds((prev) =>
        prev.map((ad) => (ad._id === id ? { ...ad, status } : ad))
      );
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
        <h1 className="page-title">Ad Campaigns</h1>
        <p className="page-description">
          Manage promotional content from residents.
        </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <Megaphone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <MaintenanceDataTable
            columns={columns({
              onApprove: (id) => handleStatusChange(id, "ACTIVE"),
              onReject: (id) => handleStatusChange(id, "REJECTED"),
            })}
            data={ads}
            filterColumnId="targetItem"
            filterPlaceholder="Filter by ad title..."
            emptyMessage="No ad campaigns found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
