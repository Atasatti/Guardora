"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Report, ReportType, ReportStatus } from "@/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";

// --- HELPER: Badge Colors ---
const getTypeBadge = (type: ReportType) => {
  switch (type) {
    case "PERSON":
      return <Badge variant="destructive">Person</Badge>;
    case "SOCIAL_POST":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Content</Badge>;
    case "MARKET_PRODUCT":
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">Product</Badge>
      );
    default:
      return <Badge variant="secondary">Other</Badge>;
  }
};

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="destructive" className="animate-pulse">
          New
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
          Reviewed
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Resolved
        </Badge>
      );
    case "DISMISSED":
      return <Badge variant="secondary">Dismissed</Badge>;
  }
};

export const columns = (callbacks: {
  onView: (report: Report) => void;
  onDelete: (report: Report) => void;
}): ColumnDef<Report>[] => [
  // 1. Reporter Info (Combined Avatar + Name)
  {
    accessorKey: "reporter",
    header: "Reporter",
    cell: ({ row }) => {
      const reporter = row.original.reporter;
      if (!reporter)
        return <span className="text-muted-foreground">Unknown</span>;

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`${STORAGE_BASE_URL}/${reporter.profilePicture}`}
            />
            <AvatarFallback>
              {reporter.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{reporter.name}</span>
            <span className="text-xs text-muted-foreground">
              Unit: {reporter.unitNumber}
            </span>
          </div>
        </div>
      );
    },
  },

  // 2. Type
  {
    accessorKey: "type",
    header: "Category",
    cell: ({ row }) => getTypeBadge(row.original.type),
  },

  // 3. Reason (Truncated)
  {
    accessorKey: "reason",
    header: "Complaint",
    cell: ({ row }) => {
      return (
        <div
          className="max-w-[300px] truncate text-sm text-muted-foreground"
          title={row.original.reason}
        >
          {row.original.reason}
        </div>
      );
    },
  },

  // 4. Status
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },

  // 5. Date
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd MMM, HH:mm"),
  },

  // 6. Actions
  {
    id: "actions",
    cell: ({ row }) => {
      const report = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => callbacks.onView(report)}>
              <Eye className="mr-2 h-4 w-4" />
              Review Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => callbacks.onDelete(report)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
