"use client";

import { useState, useRef } from "react";
import { User } from "@/models";
import { adminUpdateUser, uploadProfilePicture } from "@/lib/actions/users";
import { changePassword } from "@/lib/actions/auth";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  User as UserIcon,
  Shield,
  Palette,
  Moon,
  Sun,
  Camera,
} from "lucide-react";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { useTheme } from "next-themes";

interface Props {
  user: User;
}

export default function SettingsClient({ user }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, theme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    unitNumber: user.unitNumber,
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    const res = await adminUpdateUser(user._id, formData);
    if (res.success) toast.success("Profile updated");
    else toast.error(res.message || "Failed");
    setIsLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const form = new FormData();
      form.append("profilePicture", file);

      const res = await uploadProfilePicture(form);
      if (res.success) {
        toast.success("Photo updated");
      } else {
        toast.error(res.message || "Failed to upload");
      }
      setIsUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    setIsLoading(true);
    const res = await changePassword(passwordData);
    if (res.success) {
      toast.success("Password changed successfully");
      setIsPasswordModalOpen(false);
      setPasswordData({ oldPassword: "", newPassword: "" });
    } else {
      toast.error(res.message || "Failed to change password");
    }
    setIsLoading(false);
  };

  const handleLogout = async () => await logout();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and public info.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-muted">
                    <AvatarImage
                      src={`${STORAGE_BASE_URL}/${user.profilePicture}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold border px-2 py-0.5 rounded w-fit text-[10px]">
                    {user.role}
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="ml-auto"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="mr-2 h-4 w-4" /> Change Photo
                </Button>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={formData.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit / Office Number</Label>
                  <Input
                    value={formData.unitNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, unitNumber: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 bg-muted/20 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {["light", "dark", "system"].map((mode) => (
                  <div
                    key={mode}
                    className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors ${
                      theme === mode
                        ? "border-primary bg-muted/30"
                        : "border-muted"
                    }`}
                    onClick={() => setTheme(mode)}
                  >
                    {mode === "light" && (
                      <Sun className="h-8 w-8 text-orange-500" />
                    )}
                    {mode === "dark" && (
                      <Moon className="h-8 w-8 text-blue-500" />
                    )}
                    {mode === "system" && (
                      <Palette className="h-8 w-8 text-purple-500" />
                    )}
                    <span className="font-medium text-sm capitalize">
                      {mode} Mode
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage authentication and sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <h4 className="text-sm font-medium">Change Password</h4>
                  <p className="text-xs text-muted-foreground">
                    Update your credentials securely.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Update Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="text-sm font-medium text-destructive">
                    Log Out
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    End current session.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    oldPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
