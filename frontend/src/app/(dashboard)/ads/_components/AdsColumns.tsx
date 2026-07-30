"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Ad, Product, Service } from "@/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import Image from "next/image";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500">Active</Badge>;
    case "PENDING":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Pending
        </Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const columns = (callbacks: {
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}): ColumnDef<Ad>[] => [
  {
    accessorKey: "advertiser",
    header: "Advertiser",
    cell: ({ row }) => {
      const user = row.original.advertiser;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                user.profilePicture
                  ? `${STORAGE_BASE_URL}/${user.profilePicture}`
                  : undefined
              }
            />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              Unit {user.unitNumber}
            </span>
          </div>
        </div>
      );
    },
  },

  {
    id: "targetItem",
    accessorFn: (ad) =>
      (ad.targetItem as Product | Service | null)?.title || "Deleted item",
    header: "Ad Content",
    cell: ({ row }) => {
      const ad = row.original;
      const item = ad.targetItem as Product | Service;

      if (!item)
        return <span className="text-destructive italic">Item Deleted</span>;

      const title = item.title || "Unknown Item";
      const image =
        item.images && item.images.length > 0 ? item.images[0] : null;

      return (
        <div className="flex items-center gap-3">
          {image ? (
            <Image
              src={`${STORAGE_BASE_URL}/${image}`}
              alt="Ad"
              width={40}
              height={40}
              className="h-10 w-10 object-cover rounded-md border"
            />
          ) : (
            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-xs">
              No Img
            </div>
          )}
          <div>
            <div className="font-medium">{title}</div>
            <Badge variant="secondary" className="text-[10px] h-5">
              {ad.targetModel}
            </Badge>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "clicks",
    header: "Performance",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold">{row.original.clicks} Clicks</span>
        <span className="text-xs text-muted-foreground">
          {row.original.durationDays} Days Duration
        </span>
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const ad = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {ad.status === "PENDING" && (
              <>
                <DropdownMenuItem
                  onClick={() => callbacks.onApprove(ad._id)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => callbacks.onReject(ad._id)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}

            {ad.status === "ACTIVE" && (
              <DropdownMenuItem
                onClick={() => callbacks.onReject(ad._id)}
                className="text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Stop Ad
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
