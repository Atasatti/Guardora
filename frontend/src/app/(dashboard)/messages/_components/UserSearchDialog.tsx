"use client";

import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/actions/users";
import { User } from "@/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";

export function UserSearchDialog() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (open && users.length === 0) {
      getAllUsers().then((res) => {
        if (res.success && res.users) setUsers(res.users);
      });
    }
  }, [open, users.length]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.unitNumber.includes(search)
  );

  const handleSelectUser = (userId: string) => {
    setOpen(false);
    router.push(`/chat/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by name or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="h-[300px] overflow-y-auto border rounded-md">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelectUser(user._id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user.profilePicture
                        ? `${STORAGE_BASE_URL}/${user.profilePicture}`
                        : undefined
                    }
                  />
                  <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.role} • Unit {user.unitNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
