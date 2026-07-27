"use client";

import {
  Users,
  ClipboardList,
  Wrench,
  ShieldAlert,
  Activity,
  Map as MapIcon,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  SocietyArea,
  MaintenanceTicket,
  ModerationCase,
  SecurityAlert,
  Visitor,
} from "@/models";
import { format } from "date-fns";

interface DashboardData {
  userCount: number;
  activeVisitors: number;
  pendingMaintenance: number;
  openModeration: number;
  maintenanceTickets: MaintenanceTicket[];
  moderationCases: ModerationCase[];
  areas: SocietyArea[];
  alerts: SecurityAlert[];
  visitors: Visitor[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const {
    userCount,
    activeVisitors,
    pendingMaintenance,
    openModeration,
    maintenanceTickets,
    moderationCases,
    areas,
    alerts,
  } = data;

  const unsafeAreas = areas.filter((a) => !a.isSafe);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of society operations and security status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md hidden md:block">
            {format(new Date(), "EEEE, MMMM do, yyyy")}
          </span>
          {/* --- LINK TO ANALYTICS --- */}
          <Button asChild>
            <Link href="/analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* --- TOP ROW: KPI CARDS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Residents"
          value={userCount}
          icon={Users}
          description="Registered users"
          href="/users"
        />
        <KpiCard
          title="Active Visitors"
          value={activeVisitors}
          icon={ClipboardList}
          description="Currently on premises"
          href="/visitors"
          trend={activeVisitors > 0 ? "Live" : undefined}
        />
        <KpiCard
          title="Open Maintenance"
          value={pendingMaintenance}
          icon={Wrench}
          description="Requests pending"
          href="/maintenance"
          alert={pendingMaintenance > 5}
        />
        <KpiCard
          title="Content Flags"
          value={openModeration}
          icon={ShieldAlert}
          description="AI moderation queue"
          href="/moderation"
          alert={openModeration > 0}
        />
      </div>

      {/* --- MIDDLE ROW: SECURITY & MAP STATUS --- */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Security Health (4 cols) */}
        <Card className="col-span-4 bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> Security Pulse
            </CardTitle>
            <CardDescription>
              Real-time system health and map status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Map Sectors
                  </span>
                  <MapIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                {unsafeAreas.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-bold">All Sectors Secure</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="font-bold">
                      {unsafeAreas.length} Hazard Zones
                    </span>
                  </div>
                )}
                <Link
                  href="/safety-map"
                  className="text-xs text-blue-500 hover:underline mt-1 block"
                >
                  View Safety Map &rarr;
                </Link>
              </div>

              <div className="p-4 rounded-lg border bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Active Alerts
                  </span>
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Unreviewed incidents
                </p>
                <Link
                  href="/alerts"
                  className="text-xs text-blue-500 hover:underline mt-1 block"
                >
                  Open Logs &rarr;
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent Activity</h4>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    No active security alerts.
                  </div>
                ) : (
                  alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert._id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-background border"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="destructive"
                          className="text-[10px] h-5"
                        >
                          {alert.type}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-[150px]">
                          {alert.cameraName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (3 cols) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href="/announcements">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold">Post Announcement</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Broadcast update to residents
                  </span>
                </div>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href="/visitors">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold">Issue Visitor Pass</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Create entry code for guest
                  </span>
                </div>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link href="/users">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold">Register Resident</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Onboard new unit owner
                  </span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- BOTTOM ROW: TASK LISTS --- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Maintenance Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>
                Recent tickets requiring attention
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/maintenance">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending maintenance tickets.
                </p>
              ) : (
                maintenanceTickets.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        By {ticket.requester.name} •{" "}
                        {ticket.requester.unitNumber}
                      </p>
                    </div>
                    <Badge
                      variant={
                        ticket.status === "IN_PROGRESS"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Moderation Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Moderation Queue</CardTitle>
              <CardDescription>Flagged content awaiting review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/moderation">
                Review All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moderationCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Queue is empty. Good job!</p>
                </div>
              ) : (
                moderationCases.slice(0, 4).map((modCase) => (
                  <div
                    key={modCase._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {modCase.targetModel}
                        </Badge>
                        <p className="text-sm font-medium text-destructive">
                          {modCase.reason}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                        &quot;{modCase.flaggedContentSnippet}&quot;
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/moderation">Review</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Helper Component: KPI Card ---
function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  href,
  alert,
  trend,
}: {
  title: string;
  value: number;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  description: string;
  href: string;
  alert?: boolean;
  trend?: string;
}) {
  return (
    <Link href={href}>
      <Card
        className={`hover:bg-accent/50 transition-colors cursor-pointer ${
          alert ? "border-destructive/50 bg-destructive/5" : ""
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon
            className={`h-4 w-4 ${
              alert ? "text-destructive" : "text-muted-foreground"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {value}
            {trend && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100"
              >
                {trend}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
