"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Post } from "@/models";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Heart,
  MessageCircle,
  ImageIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const columns = (callbacks: {
  onView: (post: Post) => void;
  onDelete: (post: Post) => void;
}): ColumnDef<Post>[] => [
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const author = row.original.author;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`${STORAGE_BASE_URL}/${author.profilePicture}`} />
            <AvatarFallback>
              {author.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{author.name}</span>
            <span className="text-xs text-muted-foreground">
              Unit {author.unitNumber}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Content",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-sm text-muted-foreground">
        {row.original.description}
      </div>
    ),
  },
  {
    accessorKey: "images",
    header: "Media",
    cell: ({ row }) => {
      const count = row.original.images?.length || 0;
      if (count === 0)
        return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <Badge variant="secondary" className="flex w-fit gap-1">
          <ImageIcon className="h-3 w-3" /> {count}
        </Badge>
      );
    },
  },
  {
    id: "stats",
    header: "Engagement",
    cell: ({ row }) => (
      <div className="flex gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" /> {row.original.totalLikes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" /> {row.original.totalComments}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Posted At",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, HH:mm"),
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
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => callbacks.onDelete(row.original)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
