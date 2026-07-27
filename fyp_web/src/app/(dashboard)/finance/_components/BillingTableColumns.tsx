"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Bill } from "@/models";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { useMemo } from "react";

// Helper function to get status badge
const getStatusBadge = (isCleared: boolean) => {
  if (isCleared) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Paid
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-orange-600 border-orange-600">
      Pending
    </Badge>
  );
};

// Helper function to get type badge
const getTypeBadge = (type: string) => {
  const colors: { [key: string]: string } = {
    MAINTENANCE: "bg-blue-100 text-blue-800 border-blue-200",
    UTILITY: "bg-green-100 text-green-800 border-green-200",
    FACILITY: "bg-purple-100 text-purple-800 border-purple-200",
    PENALTY: "bg-red-100 text-red-800 border-red-200",
    OTHER: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge variant="outline" className={colors[type] || colors.OTHER}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </Badge>
  );
};

// Helper to check if bill is overdue
const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date();
};

// Use useMemo to prevent columns from recreating on every render
export const useBillingColumns = (callbacks: {
  onView: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}) => {
  const { onView, onDelete } = callbacks;

  return useMemo(
    (): ColumnDef<Bill>[] => [
      // 1. Resident Column
      {
        accessorKey: "user",
        header: "Resident",
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={`${STORAGE_BASE_URL}/${user.profilePicture}`}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">
                  Unit {user.unitNumber}
                </div>
              </div>
            </div>
          );
        },
      },

      // 2. Bill Details Column
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Bill Details
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const bill = row.original;
          const overdue = !bill.isCleared && isOverdue(bill.dueDate);

          return (
            <div className="space-y-1 min-w-[200px]">
              <div className="font-medium flex items-center gap-2">
                {bill.title}
                {overdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
              {bill.description && (
                <div className="text-sm text-muted-foreground line-clamp-1 overflow-ellipsis">
                  {bill.description}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Due: {format(new Date(bill.dueDate), "MMM dd, yyyy")}
              </div>
            </div>
          );
        },
      },

      // 3. Amount Column
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.original.amount;
          return (
            <div className="font-semibold text-right min-w-[100px]">
              ${amount.toFixed(2)}
            </div>
          );
        },
      },

      // 4. Type Column
      {
        accessorKey: "billType",
        header: "Type",
        cell: ({ row }) => {
          const bill = row.original;
          return (
            <div className="min-w-[100px]">{getTypeBadge(bill.billType)}</div>
          );
        },
      },

      // 5. Status Column
      {
        accessorKey: "isCleared",
        header: "Status",
        cell: ({ row }) => {
          const bill = row.original;
          return (
            <div className="min-w-[80px]">{getStatusBadge(bill.isCleared)}</div>
          );
        },
      },

      // 6. Month Column
      {
        accessorKey: "month",
        header: "Month",
        cell: ({ row }) => {
          const month = row.original.month;
          return (
            <div className="text-sm min-w-[80px]">
              {format(new Date(month + "-01"), "MMM yyyy")}
            </div>
          );
        },
      },

      // 7. Actions Column
      {
        id: "actions",
        cell: ({ row }) => {
          const bill = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onView(bill)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View/Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(bill)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Bill
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onView, onDelete]
  ); // Dependencies for useMemo
};
