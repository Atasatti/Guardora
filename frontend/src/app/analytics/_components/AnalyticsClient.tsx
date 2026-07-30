"use client";

import { Visitor, MaintenanceTicket, SecurityAlert } from "@/models";
import AnalyticsCharts from "./AnalyticsCharts";
import { TrendingUp, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  visitors: Visitor[];
  tickets: MaintenanceTicket[];
  alerts: SecurityAlert[];
}

export default function AnalyticsClient({ visitors, tickets, alerts }: Props) {
  const totalVisitors = visitors.length;
  const totalAlerts = alerts.length;
  const completedTickets = tickets.filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const completionRate =
    tickets.length > 0
      ? Math.round((completedTickets / tickets.length) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="metric-card py-5">
          <CardContent className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Total Traffic
            </p>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {totalVisitors}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Recorded visitor entries
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10">
            <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          </CardContent>
        </Card>

        <Card className="metric-card py-5">
          <CardContent className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Ticket Resolution
            </p>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {completionRate}%
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Maintenance completion rate
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10">
            <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          </CardContent>
        </Card>

        <Card className="metric-card py-5">
          <CardContent className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Security Level
            </p>
            <p className="text-2xl font-semibold tracking-[-0.04em]">
              {totalAlerts > 10 ? "High Alert" : "Nominal"}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Based on {totalAlerts} recorded alerts
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10">
            <ShieldCheck className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts visitors={visitors} tickets={tickets} alerts={alerts} />
    </div>
  );
}
