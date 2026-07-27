"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Terminal } from "lucide-react";
import { SecurityAlert } from "@/models";
import ReviewAlertModal from "../../alerts/_components/ReviewAlertModal";
import { updateAlertStatus } from "@/lib/actions/alerts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LiveAlertFeed({
  alerts,
  setAlerts,
}: {
  alerts: SecurityAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<SecurityAlert[]>>;
}) {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(
    null
  );

  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleAlertUpdate = async (
    id: string,
    status: "REVIEWED" | "DISMISSED"
  ) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert._id === id ? { ...alert, status } : alert))
    );

    setSelectedAlert(null);

    const result = await updateAlertStatus(id, status);
    if (result.success) {
      toast.success(`Alert marked as ${status}`);
    } else {
      toast.error("Failed to update alert");
    }
  };

  const dismissAll = async () => {
    const pending = alerts.filter((a) => a.status === "NEW");
    if (pending.length === 0) return;

    toast.promise(
      Promise.all(pending.map((a) => updateAlertStatus(a._id, "REVIEWED"))),
      {
        loading: "Clearing alerts...",
        success: () => {
          setAlerts((prev) => prev.map((a) => ({ ...a, status: "REVIEWED" })));
          return "All alerts cleared";
        },
        error: "Failed to clear some alerts",
      }
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 shadow-md bg-card">
        <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-mono uppercase tracking-wider">
              Security Logs
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {alerts.filter((a) => a.status === "NEW").length} PENDING
            </Badge>
            {alerts.some((a) => a.status === "NEW") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={dismissAll}
                title="Clear All"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-0">
          <div className="flex flex-col divide-y divide-border/50">
            {sortedAlerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm font-mono">
                -- No Activity Recorded --
              </div>
            ) : (
              sortedAlerts.slice(0, 5).map((alert) => {
                const isNew = alert.status === "NEW";
                return (
                  <div
                    key={alert._id}
                    className={cn(
                      "p-3 h-max-[500px] flex items-start gap-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer border-l-2",
                      isNew
                        ? "bg-red-50/50 dark:bg-red-900/10 border-l-red-500"
                        : "border-l-transparent opacity-60"
                    )}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="mt-0.5">
                      {isNew ? (
                        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            "font-bold font-mono uppercase text-xs",
                            isNew ? "text-red-600" : "text-muted-foreground"
                          )}
                        >
                          {alert.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 line-clamp-1">
                        Detected at{" "}
                        <span className="font-medium">{alert.cameraName}</span>
                      </p>
                      {isNew && (
                        <div className="flex gap-2 pt-1">
                          <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 px-1.5 py-0.5 rounded">
                            Action Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {selectedAlert && (
        <ReviewAlertModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onReview={(id) => handleAlertUpdate(id, "REVIEWED")}
          onDismiss={(id) => handleAlertUpdate(id, "DISMISSED")}
        />
      )}
    </>
  );
}
