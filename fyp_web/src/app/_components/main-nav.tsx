import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Users,
  Video,
  Siren,
  ClipboardList,
  Map,
  Wrench,
  Building,
  CreditCard,
  Megaphone,
  ShieldCheck,
  Globe,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper: NavText that adapts to screen size
const NavText = ({ text }: { text: string }) => (
  <span
    className="
      whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out
      
      /* Mobile: Always Visible */
      w-auto opacity-100 ml-2

      /* Desktop: Hidden by default, Reveal on Hover */
      md:w-0 md:opacity-0 md:ml-0
      md:group-hover:w-auto md:group-hover:opacity-100 md:group-hover:ml-2
    "
  >
    {text}
  </span>
);

const NavLink = ({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="
      flex items-center gap-2 py-2 rounded-lg text-muted-foreground transition-all hover:text-primary
      
      /* Mobile: Always Left Aligned with padding */
      justify-start px-2.5

      /* Desktop: Centered (Collapsed) -> Left Aligned (Expanded) */
      md:justify-center md:px-0
      md:group-hover:justify-start md:group-hover:px-2.5
    "
  >
    <Icon className="h-4 w-4 shrink-0" />
    {children}
  </Link>
);

// Helper: Section Header
const NavHeader = ({ text }: { text: string }) => (
  <h3
    className="
      flex items-center h-6 text-xs font-semibold uppercase text-muted-foreground
      
      /* Mobile: Always Left */
      justify-start px-2

      /* Desktop: Center -> Left */
      md:justify-center md:px-0
      md:group-hover:justify-start md:group-hover:px-2
    "
  >
    <NavText text={text} />
    {/* Fallback Dot for Desktop Collapsed State */}
    <span className="hidden md:block md:group-hover:hidden">•</span>
  </h3>
);

export function MainNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex flex-col gap-4 p-4 overflow-y-auto scrollbar-hide h-full bg-background border-r",
        // Desktop Sliding Logic:
        // 1. Fixed width on mobile (handled by Sheet)
        // 2. Variable width on Desktop (w-16 -> w-64)
        "md:w-20 md:hover:w-64 md:transition-[width] md:duration-300 md:ease-in-out group z-50",
        className
      )}
    >
      {/* Logo Area */}
      <Link
        href="/"
        className="
          flex items-center gap-2 font-semibold h-10 shrink-0
          /* Mobile: Left */
          justify-start px-2.5
          /* Desktop: Center -> Left */
          md:justify-center md:px-0
          md:group-hover:justify-start md:group-hover:px-2.5
        "
      >
        <Image
          src="/logo.png"
          alt="SecureNest Logo"
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
        />
        <NavText text="Secure Nest" />
      </Link>

      <Separator />

      {/* Navigation Groups */}

      {/* Group: Main */}
      <div className="flex flex-col gap-2">
        <NavHeader text="Main" />
        <NavLink href="/" icon={Home}>
          <NavText text="Dashboard" />
        </NavLink>
        <NavLink href="/users" icon={Users}>
          <NavText text="User Management" />
        </NavLink>
        <NavLink href="/messages" icon={MessageSquare}>
          <NavText text="Messages" />
        </NavLink>
      </div>

      {/* Group: Security */}
      <div className="flex flex-col gap-2">
        <NavHeader text="Security" />
        <NavLink href="/surveillance" icon={Video}>
          <NavText text="Surveillance" />
        </NavLink>
        <NavLink href="/reports" icon={Siren}>
          <NavText text="Incident Reports" />
        </NavLink>
        <NavLink href="/alerts" icon={ShieldAlert}>
          <NavText text="Alerts & Logs" />
        </NavLink>
        <NavLink href="/visitors" icon={ClipboardList}>
          <NavText text="Visitor Logs" />
        </NavLink>
        <NavLink href="/map" icon={Map}>
          <NavText text="Safety Map" />
        </NavLink>
      </div>

      {/* Group: Operations */}
      <div className="flex flex-col gap-2">
        <NavHeader text="Operations" />
        <NavLink href="/maintenance" icon={Wrench}>
          <NavText text="Maintenance" />
        </NavLink>
        <NavLink href="/facilities" icon={Building}>
          <NavText text="Facility Bookings" />
        </NavLink>
        <NavLink href="/finance" icon={CreditCard}>
          <NavText text="Finance & Billing" />
        </NavLink>
      </div>

      {/* Group: Content */}
      <div className="flex flex-col gap-2">
        <NavHeader text="Content" />
        <NavLink href="/announcements" icon={Megaphone}>
          <NavText text="Announcements" />
        </NavLink>
        <NavLink href="/moderation" icon={ShieldCheck}>
          <NavText text="Content Moderation" />
        </NavLink>
        <NavLink href="/ads" icon={Megaphone}>
          <NavText text="Ad Campaigns" />
        </NavLink>
        <NavLink href="/social" icon={Globe}>
          <NavText text="Social" />
        </NavLink>
      </div>
    </nav>
  );
}
