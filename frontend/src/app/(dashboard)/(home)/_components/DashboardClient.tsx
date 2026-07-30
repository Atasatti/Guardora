"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Map as MapIcon,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MaintenanceTicket,
  ModerationCase,
  SecurityAlert,
  SocietyArea,
  Visitor,
} from "@/models";

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

  const unsafeAreas = areas.filter((area) => !area.isSafe);
  const safeAreaPercent =
    areas.length === 0
      ? 100
      : Math.round(((areas.length - unsafeAreas.length) / areas.length) * 100);
  const newAlerts = alerts.filter((alert) => alert.status === "NEW");

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="page-eyebrow">
            <ShieldCheck className="size-3.5" />
            Command center
          </div>
          <h1 className="page-title">Good morning, Administrator</h1>
          <p className="page-description">
            Here is the live operational picture across your community today.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="hidden rounded-xl border border-border/75 bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-xs md:block">
            <Clock3 className="mr-2 inline size-3.5 text-primary" />
            {format(new Date(), "EEEE, MMMM d")}
          </div>
          <Button asChild>
            <Link href="/analytics">
              <BarChart3 />
              Open analytics
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Key operational metrics" className="metric-grid">
        <KpiCard
          title="Residents"
          value={userCount}
          detail="Registered community members"
          icon={Users}
          href="/users"
          tone="teal"
        />
        <KpiCard
          title="Visitors on site"
          value={activeVisitors}
          detail={activeVisitors > 0 ? "Live access records" : "No active passes"}
          icon={ClipboardList}
          href="/visitors"
          tone="blue"
          status={activeVisitors > 0 ? "Live" : undefined}
        />
        <KpiCard
          title="Open maintenance"
          value={pendingMaintenance}
          detail="Requests needing action"
          icon={Wrench}
          href="/maintenance"
          tone="amber"
          attention={pendingMaintenance > 5}
        />
        <KpiCard
          title="Moderation queue"
          value={openModeration}
          detail="AI-flagged items to review"
          icon={Sparkles}
          href="/moderation"
          tone="violet"
          attention={openModeration > 0}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-4" />
                  </span>
                  Security posture
                </CardTitle>
                <CardDescription className="mt-1">
                  Live sector coverage and incident activity
                </CardDescription>
              </div>
              <Badge
                className={
                  unsafeAreas.length === 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }
              >
                <span
                  className={`size-1.5 rounded-full ${
                    unsafeAreas.length === 0 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {unsafeAreas.length === 0
                  ? "All sectors secure"
                  : `${unsafeAreas.length} sector${
                      unsafeAreas.length === 1 ? "" : "s"
                    } need attention`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Area health
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                      {safeAreaPercent}%
                    </p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapIcon className="size-5" />
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-border/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-[width]"
                    style={{ width: `${safeAreaPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{areas.length - unsafeAreas.length} secure sectors</span>
                  <span>{unsafeAreas.length} flagged</span>
                </div>
                <Button variant="outline" className="mt-5 w-full" asChild>
                  <Link href="/map">
                    View safety map
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="section-heading">Recent security activity</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {newAlerts.length} unreviewed{" "}
                      {newAlerts.length === 1 ? "event" : "events"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/alerts">
                      View all
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2">
                  {alerts.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No active alerts"
                      description="The monitoring queue is clear."
                    />
                  ) : (
                    alerts.slice(0, 4).map((alert) => (
                      <Link
                        href="/alerts"
                        key={alert._id}
                        className="flex items-center gap-3 rounded-xl border border-border/65 px-3.5 py-3 transition-colors hover:bg-accent/45"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <ShieldAlert className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {alert.type.replaceAll("_", " ")}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {alert.cameraName || "Unassigned camera"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Start common operational workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <QuickAction
              href="/announcements"
              icon={Megaphone}
              title="Publish announcement"
              detail="Notify the resident community"
            />
            <QuickAction
              href="/visitors"
              icon={ClipboardList}
              title="Issue visitor pass"
              detail="Create a secure access record"
            />
            <QuickAction
              href="/users"
              icon={UserPlus}
              title="Register resident"
              detail="Add a community member"
            />
            <QuickAction
              href="/maintenance"
              icon={Wrench}
              title="Review maintenance"
              detail="Prioritize outstanding work"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <QueueCard
          title="Maintenance workload"
          description="Latest requests requiring operational follow-up"
          href="/maintenance"
          emptyTitle="Maintenance queue is clear"
          emptyDescription="There are no outstanding service requests."
          items={maintenanceTickets.slice(0, 4).map((ticket) => ({
            id: ticket._id,
            title: ticket.title,
            meta: `${ticket.requester.name} · ${
              ticket.requester.unitNumber || "Unit not set"
            }`,
            badge: ticket.status.replaceAll("_", " "),
            tone:
              ticket.status === "IN_PROGRESS"
                ? "text-blue-700 bg-blue-500/10 dark:text-blue-300"
                : "text-amber-700 bg-amber-500/10 dark:text-amber-300",
          }))}
        />
        <QueueCard
          title="AI review queue"
          description="Flagged content awaiting an administrator decision"
          href="/moderation"
          emptyTitle="Review queue is clear"
          emptyDescription="No content requires moderation right now."
          items={moderationCases.slice(0, 4).map((item) => ({
            id: item._id,
            title: item.reason,
            meta: item.flaggedContentSnippet
              ? `“${item.flaggedContentSnippet}”`
              : item.targetModel,
            badge: item.aiConfidence || item.status,
            tone: "text-violet-700 bg-violet-500/10 dark:text-violet-300",
          }))}
        />
      </section>
    </div>
  );
}

const toneStyles = {
  teal: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  href,
  tone,
  status,
  attention,
}: {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  href: string;
  tone: keyof typeof toneStyles;
  status?: string;
  attention?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card className="metric-card h-full py-5 group-hover:border-primary/25 group-hover:shadow-[0_14px_40px_rgb(15_23_42_/_7%)]">
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-[1.8rem] font-semibold leading-none tracking-[-0.05em]">
                  {value}
                </p>
                {status && (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {status}
                  </Badge>
                )}
                {attention && (
                  <span className="size-2 rounded-full bg-amber-500 ring-4 ring-amber-500/10" />
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
            </div>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
            >
              <Icon className="size-[1.1rem]" strokeWidth={1.9} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border/65 p-3 transition-colors hover:border-primary/20 hover:bg-accent/45"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
      <ArrowUpRight className="size-4 text-muted-foreground/55 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function QueueCard({
  title,
  description,
  href,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  href: string;
  items: {
    id: string;
    title: string;
    meta: string;
    badge: string;
    tone: string;
  }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            View all
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="divide-y divide-border/70">
            {items.map((item) => (
              <Link
                href={href}
                key={item.id}
                className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {item.meta}
                  </span>
                </span>
                <Badge className={item.tone}>{item.badge}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 px-4 text-center">
      <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
