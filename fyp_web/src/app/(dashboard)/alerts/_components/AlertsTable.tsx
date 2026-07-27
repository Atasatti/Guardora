"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SecurityAlert, AlertStatus } from "@/models";
import ReviewAlertModal from "./ReviewAlertModal";

export default function AlertsTable({
  alerts,
  onReview,
  onDismiss,
}: {
  alerts: SecurityAlert[];
  onReview: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(
    null
  );

  const getStatusBadge = (status: AlertStatus) => {
    if (status === "NEW") {
      return (
        <Badge variant="destructive">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          New
        </Badge>
      );
    } else if (status === "DISMISSED") {
      return <Badge variant="outline">Dismissed</Badge>;
    }
    return <Badge variant="secondary">Reviewed</Badge>;
  };

  const getAlertIcon = (type: SecurityAlert["type"]) => {
    if (type === "DANGEROUS_OBJECT") return "Gun/Knife";
    if (type === "BANNED_PERSON") return "Banned Person";
    if (type === "UNSAFE_AREA") return "Unsafe Area";
    return "Alert";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No alerts found.
              </TableCell>
            </TableRow>
          )}
          {alerts.map((alert) => (
            <TableRow key={alert._id}>
              <TableCell>{getStatusBadge(alert.status)}</TableCell>
              <TableCell className="font-medium">
                {getAlertIcon(alert.type)}
              </TableCell>
              <TableCell>{alert.cameraName}</TableCell>
              <TableCell>
                {new Date(alert.timestamp).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                >
                  {alert.status === "NEW" ? "Review" : "View"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAlert && (
        <ReviewAlertModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onReview={(id) => {
            onReview(id);
            setSelectedAlert(null);
          }}
          onDismiss={(id) => {
            onDismiss(id);
            setSelectedAlert(null);
          }}
        />
      )}
    </>
  );
}
