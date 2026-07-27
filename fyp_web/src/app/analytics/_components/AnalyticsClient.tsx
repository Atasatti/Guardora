"use client";

import { Visitor, MaintenanceTicket, SecurityAlert } from "@/models";
import AnalyticsCharts from "./AnalyticsCharts";
import { TrendingUp, ShieldCheck, Clock } from "lucide-react";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-card rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Total Traffic
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalVisitors}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-950/40 dark:to-card rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Ticket Resolution
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {completionRate}%
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-card rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Security Level
            </p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalAlerts > 10 ? "High Alert" : "Nominal"}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      <AnalyticsCharts visitors={visitors} tickets={tickets} alerts={alerts} />
    </div>
  );
}
