"use client";

import React, { useState } from "react";
import { User } from "@/models";
import { adminDeleteUser } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteUserDialog({
  user,
  isOpen,
  onClose,
  onUserDeleted,
}: {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await adminDeleteUser(user._id);

    if (result.success) {
      toast.success(result.message);
      onUserDeleted();
      onClose();
    } else {
      toast.error(result.message || "An unknown error occurred.");
    }
    setLoading(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This revokes login access while preserving security, billing, and
            audit records for{" "}
            <span className="font-semibold">{user.name}</span>&apos;s account
            . An administrator can reactivate it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, deactivate user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
