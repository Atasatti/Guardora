"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SecurityAlert, BannedPerson } from "@/models";
import AlertsTable from "./AlertsTable";
import BannedPersonsTab from "./BannedPersonsTab";
import { updateAlertStatus } from "@/lib/actions/alerts";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function AlertsClient({
  initialAlerts,
  initialBannedPersons,
}: {
  initialAlerts: SecurityAlert[];
  initialBannedPersons: BannedPerson[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [bannedPersons, setBannedPersons] = useState(initialBannedPersons);
  const [suspiciousActivity, setSuspiciousActivity] = useState<
    Array<{
      key: string;
      actorName: string;
      ipAddress?: string;
      failedAttempts: number;
      blockedAttempts: number;
      score: number;
      severity: string;
      latestAt: string;
    }>
  >([]);

  useEffect(() => {
    fetch("/api/resident/audit-logs/suspicious", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setSuspiciousActivity(body?.activity || []))
      .catch(() => {});
  }, []);

  const handleAlertUpdate = async (
    alertId: string,
    status: "REVIEWED" | "DISMISSED"
  ) => {
    setAlerts((prev) =>
      prev.map((a) => (a._id === alertId ? { ...a, status } : a))
    );
    const result = await updateAlertStatus(alertId, status);
    if (result.success) {
      toast.success(`Alert marked as ${status}`);
    } else {
      toast.error("Failed to update alert");
    }
  };

  return (
    <Tabs defaultValue="alerts">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="alerts">
          Live Alerts ({alerts.filter((a) => a.status === "NEW").length})
        </TabsTrigger>
        <TabsTrigger value="banned">Manage Banned Persons</TabsTrigger>
        <TabsTrigger value="suspicious">
          Suspicious Activity ({suspiciousActivity.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="alerts" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Security Alerts</CardTitle>
            <CardDescription>AI Detection logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsTable
              alerts={alerts}
              onReview={(id) => handleAlertUpdate(id, "REVIEWED")}
              onDismiss={(id) => handleAlertUpdate(id, "DISMISSED")}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="banned" className="mt-4">
        <BannedPersonsTab
          bannedPersons={bannedPersons}
          setBannedPersons={setBannedPersons}
        />
      </TabsContent>

      <TabsContent value="suspicious" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Authentication risk review</CardTitle>
            <CardDescription>
              Risk-scored failed and locked login activity from the last 24
              hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suspiciousActivity.map((activity) => (
              <div
                key={activity.key}
                className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                  <ShieldAlert className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{activity.actorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.ipAddress || "Unknown IP"} ·{" "}
                    {new Date(activity.latestAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">{activity.severity}</p>
                  <p className="text-muted-foreground">
                    {activity.failedAttempts} failed ·{" "}
                    {activity.blockedAttempts} blocked · score {activity.score}
                  </p>
                </div>
              </div>
            ))}
            {!suspiciousActivity.length && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No suspicious login pattern crossed the review threshold.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
