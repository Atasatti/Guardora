"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Visitor, VisitorType, VisitorStatus } from "@/models";
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
import { ArrowUpDown, MoreHorizontal, Eye, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Helper for Type Badge Colors
const getTypeBadge = (type: VisitorType) => {
  switch (type) {
    case "GUEST":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Guest</Badge>;
    case "DELIVERY":
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">Delivery</Badge>
      );
    case "SERVICE":
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600">Service</Badge>
      );
    case "RIDE":
      return <Badge className="bg-cyan-500 hover:bg-cyan-600">Ride</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

// Helper for Status Badge
const getStatusBadge = (status: VisitorStatus) => {
  if (status === "ACTIVE") {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Active
      </Badge>
    );
  }
  return <Badge variant="secondary">Expired</Badge>;
};

export const columns = (callbacks: {
  onView: (visitor: Visitor) => void;
  onDelete: (visitor: Visitor) => void;
}): ColumnDef<Visitor>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Visitor Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => getTypeBadge(row.original.type),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "entryCode",
    header: "Entry Code",
    cell: ({ row }) => {
      const code = row.original.entryCode;
      if (!code) return <span className="text-muted-foreground">-</span>;
      return (
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success("Entry code copied");
          }}
        >
          <span className="font-mono font-medium">{code}</span>
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: "visitDate",
    header: "Visit Date",
    cell: ({ row }) => {
      return format(new Date(row.original.visitDate), "dd MMM, HH:mm");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const visitor = row.original;
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
            <DropdownMenuItem onClick={() => callbacks.onView(visitor)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => callbacks.onDelete(visitor)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Pass
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
