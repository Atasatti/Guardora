"use client";

import { User, UserRole } from "@/models";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import ClientDate from "./ClientDate";

export default function UserTableRow({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>;
      case "MODERATOR":
        return <Badge className="bg-yellow-500">Moderator</Badge>;
      case "RESIDENT":
      default:
        return <Badge variant="secondary">Resident</Badge>;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={
                user.profilePicture
                  ? `${STORAGE_BASE_URL}/${user.profilePicture}`
                  : undefined
              }
              alt={user.name}
            />
            <AvatarFallback>
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{user.unitNumber}</TableCell>
      <TableCell>{user.phoneNumber}</TableCell>
      <TableCell>{getRoleBadge(user.role)}</TableCell>
      <TableCell>
        <ClientDate date={user.createdAt} />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {/* --- THIS IS THE CHANGE --- */}
            <DropdownMenuItem asChild>
              <Link href={`/users/${user._id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Full Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
