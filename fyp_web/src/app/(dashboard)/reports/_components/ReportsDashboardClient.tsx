"use client";

import { useState } from "react";
import { Report } from "@/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import ReportsDataTable from "./ReportsDataTable";
import { columns } from "./ReportsTableColumns";
import ViewReportModal from "./ViewReportModal";

export default function ReportsDashboardClient({
  initialReports,
}: {
  initialReports: Report[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // --- Stats Calculation ---
  const pendingReports = reports.filter(
    (r) => r.status === "PENDING" || r.status === "REVIEWED"
  );
  const resolvedReports = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "DISMISSED"
  );
  const criticalReports = reports.filter(
    (r) => r.type === "PERSON" || r.type === "SOCIAL_POST"
  ).length;

  // --- Handlers ---
  const handleReportUpdated = (updatedReport: Report) => {
    setReports((prev) =>
      prev.map((r) => (r._id === updatedReport._id ? updatedReport : r))
    );
  };

  const handleReportDeleted = (id: string) => {
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <>
      <div className="flex flex-col h-full w-full gap-6">
        {/* --- Header --- */}
        <header>
          <h1 className="text-3xl font-bold">Community Reports</h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve complaints, content flags, and safety issues.
          </p>
        </header>

        {/* --- Stats Overview --- */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Action
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReports.length}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resolved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedReports.length}</div>
              <p className="text-xs text-muted-foreground">Closed tickets</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Priority
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalReports}</div>
              <p className="text-xs text-muted-foreground">
                Person/Content flags
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Tabs & Table --- */}
        <Card className="flex-1 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Reports Console</CardTitle>
            <CardDescription>
              Filter reports by their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                <TabsTrigger value="pending">
                  Pending ({pendingReports.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  History ({resolvedReports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <ReportsDataTable
                  columns={columns({
                    onView: setSelectedReport,
                    onDelete: setSelectedReport,
                  })}
                  data={pendingReports}
                />
              </TabsContent>

              <TabsContent value="history">
                <ReportsDataTable
                  columns={columns({
                    onView: setSelectedReport,
                    onDelete: setSelectedReport,
                  })}
                  data={resolvedReports}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* --- Modal --- */}
      <ViewReportModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdated={handleReportUpdated}
        onDeleted={handleReportDeleted}
      />
    </>
  );
}
