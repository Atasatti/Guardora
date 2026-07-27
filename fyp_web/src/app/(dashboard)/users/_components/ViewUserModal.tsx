"use client";

import { User } from "@/models";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ViewUserModal({
  user,
  isOpen,
  onClose,
}: {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
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
          <DialogTitle className="text-2xl">{user.name}</DialogTitle>
          <DialogDescription>
            {user.role} | Unit: {user.unitNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-sm">
            <Label className="font-semibold">Email</Label>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="text-sm">
            <Label className="font-semibold">Phone</Label>
            <p className="text-muted-foreground">{user.phoneNumber}</p>
          </div>
          <div className="text-sm">
            <Label className="font-semibold">Joined</Label>
            <p className="text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-sm">
            <Label className="font-semibold">User ID</Label>
            <p className="text-muted-foreground truncate">{user._id}</p>
          </div>

          <div className="col-span-2">
            <Label className="font-semibold">Emergency Contact</Label>
            {user.emergencyContact?.name ? (
              <div className="text-sm text-muted-foreground p-2 border rounded-md">
                <p>Name: {user.emergencyContact.name}</p>
                <p>Phone: {user.emergencyContact.phoneNumber}</p>
                <p>Relation: {user.emergencyContact.relationship}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not set</p>
            )}
          </div>
          <div className="text-sm">
            <Label className="font-semibold">Followers</Label>
            <p className="text-muted-foreground">
              {user.socialStats.totalFollowers}
            </p>
          </div>
          <div className="text-sm">
            <Label className="font-semibold">Following</Label>
            <p className="text-muted-foreground">
              {user.socialStats.totalFollowing}
            </p>
          </div>
          <div className="text-sm">
            <Label className="font-semibold">Products Sold</Label>
            <p className="text-muted-foreground">
              {user.sellerStats.itemsSold}
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
