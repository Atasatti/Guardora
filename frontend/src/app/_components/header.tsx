"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";
import { MainNav } from "./main-nav";
import { logout } from "@/lib/actions";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { Notification } from "@/models";

const routeLabels: Record<string, string> = {
  "/": "Overview",
  "/analytics": "Analytics",
  "/messages": "Messages",
  "/surveillance": "Surveillance",
  "/alerts": "Alerts & logs",
  "/reports": "Incident reports",
  "/visitors": "Visitor access",
  "/map": "Safety map",
  "/users": "Residents",
  "/maintenance": "Maintenance",
  "/facilities": "Facilities",
  "/finance": "Finance",
  "/announcements": "Announcements",
  "/moderation": "AI moderation",
  "/ads": "Ad campaigns",
  "/social": "Social & marketplace",
  "/settings": "Settings",
};

function getRouteLabel(pathname: string) {
  const route = Object.keys(routeLabels)
    .filter((key) => key !== "/")
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));

  return route ? routeLabels[route] : routeLabels["/"];
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const result = await getNotifications();
      if (active && result.success) {
        setNotifications(result.notifications);
        setUnread(result.unread);
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border/70 bg-background/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Control center
              <span className="text-border">/</span>
              <span className="truncate text-foreground">
                {getRouteLabel(pathname)}
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live monitoring
          </div>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative"
                aria-label={`${unread} unread notifications`}
              >
                <Bell className="size-[1.05rem]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-semibold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">
                  Notifications
                </DropdownMenuLabel>
                {unread > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary"
                    onClick={async (event) => {
                      event.preventDefault();
                      await markAllNotificationsRead();
                      setUnread(0);
                      setNotifications((items) =>
                        items.map((item) => ({
                          ...item,
                          readAt: new Date().toISOString(),
                        }))
                      );
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className="block cursor-pointer py-2.5"
                    onSelect={async () => {
                      if (!notification.readAt) {
                        await markNotificationRead(notification._id);
                        setUnread((count) => Math.max(0, count - 1));
                      }
                      if (notification.link) router.push(notification.link);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          notification.readAt ? "bg-border" : "bg-primary"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-semibold">
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-xl px-2 sm:pr-3"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CircleUserRound className="size-4.5" />
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-none">
                    Administrator
                  </span>
                  <span className="mt-1 block text-[0.65rem] leading-none text-muted-foreground">
                    Operations team
                  </span>
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block">Guardora admin</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Secure operations workspace
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                <Settings />
                Account settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleLogout}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[292px] border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate Guardora administration
          </SheetDescription>
          <MainNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
