"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Announcement } from "@/models";
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
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Pin } from "lucide-react";
import { format } from "date-fns";

export const columns = (callbacks: {
  onEdit: (item: Announcement) => void;
  onDelete: (item: Announcement) => void;
  onPin: (item: Announcement) => void;
}): ColumnDef<Announcement>[] => [
  // 1. Title
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex min-w-[150px] items-center gap-2 font-medium">
        {row.original.isPinned && <Pin className="size-3.5 text-primary" />}
        {row.original.title}
      </div>
    ),
  },

  // 2. Description
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate text-muted-foreground"
        title={row.original.description}
      >
        {row.original.description}
      </div>
    ),
  },

  // 3. Urgency
  {
    accessorKey: "isUrgent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isUrgent = row.original.isUrgent;
      return row.original.kind === "POLL" ? (
        <Badge variant="outline">Poll</Badge>
      ) : isUrgent ? (
        <Badge variant="destructive">Urgent</Badge>
      ) : (
        <Badge variant="secondary">Normal</Badge>
      );
    },
  },

  // 4. Date
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
      return format(new Date(row.original.createdAt), "MMM dd, yyyy");
    },
  },

  // 5. Actions
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
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
            <DropdownMenuItem onClick={() => callbacks.onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callbacks.onPin(item)}>
              <Pin className="mr-2 h-4 w-4" />
              {item.isPinned ? "Unpin" : "Pin to top"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => callbacks.onDelete(item)}
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
