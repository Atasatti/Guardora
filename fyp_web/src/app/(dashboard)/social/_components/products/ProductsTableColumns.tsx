"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/models";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
      );
    case "SOLD":
      return <Badge variant="secondary">Sold</Badge>;
    case "RESERVED":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Reserved</Badge>
      );
    case "DELETED":
      return <Badge variant="destructive">Deleted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const columns = (callbacks: {
  onView: (product: Product) => void; // <--- FIXED: Changed Post to Product
  onDelete: (product: Product) => void; // <--- FIXED: Changed Post to Product
}): ColumnDef<Product>[] => [
  {
    accessorKey: "title",
    header: "Item",
    cell: ({ row }) => {
      const img = row.original.images[0];
      return (
        <div className="flex items-center gap-3">
          {img ? (
            <div className="h-10 w-10 relative rounded overflow-hidden">
              <Image
                src={`${STORAGE_BASE_URL}/${img}`}
                alt="Product"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 bg-muted rounded" />
          )}
          <span className="font-medium text-sm">{row.original.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "sellerId",
    header: "Seller",
    cell: ({ row }) => {
      const seller = row.original.sellerId;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`${STORAGE_BASE_URL}/${seller.profilePicture}`} />
            <AvatarFallback>
              {seller.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{seller.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <span className="font-bold">${row.original.price}</span>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => callbacks.onView(row.original)}>
            <Eye className="mr-2 h-4 w-4" /> View / Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => callbacks.onDelete(row.original)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Listing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
