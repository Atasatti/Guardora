"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Facility } from "@/models";
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
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { format } from "date-fns";
import Image from "next/image";

// Helper function to format capacity display
const formatCapacity = (available: number, total: number) => {
  return `${available}/${total}`;
};

// Helper function to get payment badge
const getPaymentBadge = (isPaid: boolean, price?: number) => {
  if (isPaid) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        ${price}/hour
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-blue-600 border-blue-600">
      Free
    </Badge>
  );
};

export const columns = (callbacks: {
  onView: (facility: Facility) => void;
  onDelete: (facility: Facility) => void;
}): ColumnDef<Facility>[] => [
  // 1. Name Column
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Facility Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const facility = row.original;
      return (
        <div className="flex items-center gap-3">
          <Image
            src={`${STORAGE_BASE_URL}/${facility.imageUrl}`}
            alt={facility.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-cover"
          />
          <div className="font-medium">{facility.name}</div>
        </div>
      );
    },
  },

  // 2. Capacity Column
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => {
      const facility = row.original;
      const usagePercentage =
        (facility.availableCapacity / facility.totalCapacity) * 100;

      return (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              {formatCapacity(
                facility.availableCapacity,
                facility.totalCapacity
              )}
            </span>
            <span className="text-muted-foreground">
              {Math.round(usagePercentage)}% available
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
      );
    },
  },

  // 3. Payment Type Column
  {
    accessorKey: "isPaidService",
    header: "Payment",
    cell: ({ row }) => {
      const facility = row.original;
      return getPaymentBadge(facility.isPaidService, facility.pricePerHour);
    },
  },

  // 4. Operating Hours Column
  {
    accessorKey: "operatingHours",
    header: "Operating Hours",
    cell: ({ row }) => {
      const facility = row.original;
      return (
        <div className="text-sm">
          {facility.openTime} - {facility.closeTime}
        </div>
      );
    },
  },

  // 5. Rules Count Column
  {
    accessorKey: "rules",
    header: "Rules",
    cell: ({ row }) => {
      const facility = row.original;
      return <Badge variant="secondary">{facility.rules.length} rules</Badge>;
    },
  },

  // 6. Last Updated Column
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return format(new Date(row.original.updatedAt), "dd MMM, yyyy");
    },
  },

  // 7. Actions Column
  {
    id: "actions",
    cell: ({ row }) => {
      const facility = row.original;
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
            <DropdownMenuItem onClick={() => callbacks.onView(facility)}>
              <Eye className="mr-2 h-4 w-4" />
              View/Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => callbacks.onDelete(facility)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Facility
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
