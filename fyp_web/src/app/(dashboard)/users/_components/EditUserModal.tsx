"use client";

import React, { useState } from "react";
import {
  AccountStatus,
  ModeratorPermission,
  User,
  UserRole,
} from "@/models";
import { adminUpdateUser } from "@/lib/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PERMISSIONS: { value: ModeratorPermission; label: string }[] = [
  { value: "MANAGE_USERS", label: "Residents" },
  { value: "MANAGE_SURVEILLANCE", label: "Surveillance" },
  { value: "MANAGE_VISITORS", label: "Visitors" },
  { value: "MANAGE_ALERTS", label: "Alerts & incidents" },
  { value: "MANAGE_CONTENT", label: "Community content" },
  { value: "MANAGE_MAINTENANCE", label: "Maintenance" },
  { value: "MANAGE_BILLING", label: "Billing" },
  { value: "MANAGE_FACILITIES", label: "Facilities" },
  { value: "MANAGE_MAP", label: "Safety map" },
  { value: "MANAGE_ADS", label: "Advertising" },
];

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    unitNumber: user.unitNumber,
    role: user.role,
    accountStatus: user.accountStatus || "ACTIVE",
    permissions: user.permissions || [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setAccessField = (
    field: "role" | "accountStatus",
    value: UserRole | AccountStatus
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "role" && value !== "MODERATOR"
        ? { permissions: [] }
        : {}),
    }));
  };

  const togglePermission = (
    permission: ModeratorPermission,
    checked: boolean
  ) => {
    setFormData((previous) => ({
      ...previous,
      permissions: checked
        ? [...new Set([...previous.permissions, permission])]
        : previous.permissions.filter((item) => item !== permission),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const result = await adminUpdateUser(user._id, formData);

    if (result.success) {
      toast.success(result.message);
      onUserUpdated();
      onClose();
    } else {
      toast.error(result.message || "An unknown error occurred.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update identity, account state, role, and moderator permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <select
              id="role"
              value={formData.role}
              onChange={(event) =>
                setAccessField("role", event.target.value as UserRole)
              }
              className="col-span-3 h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="RESIDENT">Resident</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountStatus" className="text-right">
              Status
            </Label>
            <select
              id="accountStatus"
              value={formData.accountStatus}
              onChange={(event) =>
                setAccessField(
                  "accountStatus",
                  event.target.value as AccountStatus
                )
              }
              className="col-span-3 h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
          {formData.role === "MODERATOR" && (
            <div className="grid grid-cols-4 gap-4">
              <Label className="pt-1 text-right">Access</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2 rounded-md border p-3">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.value}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={(checked) =>
                        togglePermission(permission.value, checked === true)
                      }
                    />
                    {permission.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Phone
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitNumber" className="text-right">
              Unit
            </Label>
            <Input
              id="unitNumber"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
