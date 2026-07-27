"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MaintenanceTicket, TicketStatus } from "@/models";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { format } from "date-fns";

// Helper function to get a color for each status
const getStatusBadge = (status: TicketStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Pending
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="outline" className="text-blue-500 border-blue-500">
          In Progress
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="text-green-500 border-green-500">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-500">
          Unknown
        </Badge>
      );
  }
};

// This defines the columns for our table
export const columns = (callbacks: {
  onView: (ticket: MaintenanceTicket) => void;
  onDelete: (ticket: MaintenanceTicket) => void;
}): ColumnDef<MaintenanceTicket>[] => [
  // 1. Requester Column
  {
    accessorKey: "requester",
    header: "Requester",
    cell: ({ row }) => {
      const requester = row.original.requester;
      if (!requester) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                requester.profilePicture
                  ? `${STORAGE_BASE_URL}/${requester.profilePicture}`
                  : undefined
              }
              alt={requester.name}
            />
            <AvatarFallback>
              {requester.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{requester.name}</div>
            <div className="text-sm text-muted-foreground">
              Unit: {requester.unitNumber}
            </div>
          </div>
        </div>
      );
    },
  },

  // 2. Title/Description Column
  {
    accessorKey: "title",
    header: "Ticket Details",
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {row.original.description}
          </div>
        </div>
      );
    },
  },

  // 3. Status Column
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => getStatusBadge(row.original.status),
  },

  // 4. Type Column
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      // Format "ELECTRICITY" to "Electricity"
      return type.charAt(0) + type.slice(1).toLowerCase();
    },
  },

  // 5. Date Created Column
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), "dd MMM, yyyy");
    },
  },

  // 6. Actions Column
  {
    id: "actions",
    cell: ({ row }) => {
      const ticket = row.original;
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
            <DropdownMenuItem onClick={() => callbacks.onView(ticket)}>
              <Eye className="mr-2 h-4 w-4" />
              View/Update Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => callbacks.onDelete(ticket)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
