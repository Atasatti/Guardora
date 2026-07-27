"use client";

import { useState } from "react";
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

export default function AlertsClient({
  initialAlerts,
  initialBannedPersons,
}: {
  initialAlerts: SecurityAlert[];
  initialBannedPersons: BannedPerson[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [bannedPersons, setBannedPersons] = useState(initialBannedPersons);

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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="alerts">
          Live Alerts ({alerts.filter((a) => a.status === "NEW").length})
        </TabsTrigger>
        <TabsTrigger value="banned">Manage Banned Persons</TabsTrigger>
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
    </Tabs>
  );
}
