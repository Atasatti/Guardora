"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Gauge,
  Globe2,
  FlaskConical,
  Map,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  ShieldEllipsis,
  Siren,
  Sparkles,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Command center",
    items: [
      { href: "/", label: "Overview", icon: Gauge },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/ai-lab", label: "AI model lab", icon: FlaskConical },
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    label: "Safety & access",
    items: [
      { href: "/surveillance", label: "Surveillance", icon: Video },
      { href: "/alerts", label: "Alerts & logs", icon: Siren },
      { href: "/reports", label: "Incident reports", icon: ShieldEllipsis },
      { href: "/visitors", label: "Visitor access", icon: ClipboardList },
      { href: "/map", label: "Safety map", icon: Map },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/users", label: "Residents", icon: Users },
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/facilities", label: "Facilities", icon: Building2 },
      { href: "/finance", label: "Finance", icon: CreditCard },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/moderation", label: "AI moderation", icon: Sparkles },
      { href: "/ads", label: "Ad campaigns", icon: Globe2 },
      { href: "/social", label: "Social & marketplace", icon: Globe2 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "flex h-full w-full flex-col overflow-y-auto bg-sidebar px-4 py-5 text-sidebar-foreground",
        className
      )}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-7 flex items-center gap-3 rounded-2xl px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <span className="brand-mark" aria-hidden="true">
          <ShieldCheck className="size-5" strokeWidth={2.4} />
        </span>
        <span className="min-w-0">
          <span className="block text-[1.05rem] font-semibold tracking-[-0.025em]">
            Guardora
          </span>
          <span className="block text-[0.68rem] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45">
            Safety operations
          </span>
        </span>
      </Link>

      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[0.85rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                        : "text-sidebar-foreground/62 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[1.05rem] shrink-0",
                        active
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground"
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <ChevronRight className="size-3.5 opacity-70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Systems operational
          </div>
          <p className="mt-1.5 text-[0.7rem] leading-5 text-sidebar-foreground/42">
            Monitoring, access, and response services are connected.
          </p>
        </div>
        <p className="mt-3 px-2 text-[0.65rem] text-sidebar-foreground/28">
          Guardora Control · v1.0
        </p>
      </div>
    </nav>
  );
}
