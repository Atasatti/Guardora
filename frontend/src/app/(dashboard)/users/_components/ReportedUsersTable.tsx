"use client";

import { Report } from "@/models";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { format } from "date-fns";
import { FileWarning } from "lucide-react";

// Helper to colorize status
const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="destructive" className="animate-pulse">
          Pending
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Reviewed</Badge>
      );
    case "RESOLVED":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Resolved
        </Badge>
      );
    case "DISMISSED":
      return <Badge variant="secondary">Dismissed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface ReportedUsersTableProps {
  reports: Report[];
  onRefresh: () => void;
}

export default function ReportedUsersTable({
  reports,
}: ReportedUsersTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
        <div className="p-4 rounded-full bg-green-100 mb-3">
          <FileWarning className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">No Reports Found</h2>
        <p className="text-muted-foreground text-sm max-w-sm text-center mt-1">
          Good news! There are no active complaints against people or visitors
          at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border flex-grow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reporter</TableHead>
            <TableHead>Complaint / Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`${STORAGE_BASE_URL}/${report.reporter?.profilePicture}`}
                    />
                    <AvatarFallback>
                      {report.reporter?.name?.substring(0, 2).toUpperCase() ??
                        "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {report.reporter?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Unit: {report.reporter?.unitNumber}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <p className="truncate text-sm" title={report.reason}>
                  {report.reason}
                </p>
              </TableCell>
              <TableCell>{getStatusBadge(report.status)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(report.createdAt), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/reports">Manage in Reports</a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
