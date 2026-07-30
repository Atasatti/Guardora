"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  HeartHandshake,
  Home,
  Loader2,
  LogOut,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Plus,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Siren,
  UserRound,
  Users,
  Vote,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/lib/actions/auth";
import { useTheme } from "next-themes";

type Tab =
  | "home"
  | "safety"
  | "community"
  | "services"
  | "market"
  | "profile";

interface Person {
  _id: string;
  name: string;
  email?: string;
  unitNumber?: string;
  role?: string;
  activeHouseholdProfile?: string;
}

interface Notice {
  _id: string;
  title: string;
  description: string;
  kind: "ANNOUNCEMENT" | "POLL";
  isUrgent: boolean;
  isPinned: boolean;
  createdAt: string;
  pollOptions?: Array<{ _id: string; text: string; voters: string[] }>;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Visitor {
  _id: string;
  name: string;
  entryCode: string;
  status: string;
  visitDate: string;
  validUntil: string;
}

interface Ticket {
  _id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Bill {
  _id: string;
  title: string;
  amount: number;
  month: string;
  dueDate: string;
  paymentStatus: string;
  receiptNumber?: string;
}

interface Facility {
  _id: string;
  name: string;
  description: string;
  openTime: string;
  closeTime: string;
  pricePerHour?: number;
  isPaidService: boolean;
  rules: string[];
}

interface Reservation {
  _id: string;
  facilityId?: { _id: string; name: string };
  date: string;
  status: string;
}

interface Area {
  _id: string;
  name: string;
  mapId: string;
  isSafe: boolean;
  riskLevel: string;
  riskReason?: string;
}

interface Post {
  _id: string;
  description: string;
  totalLikes: number;
  totalComments?: number;
  author?: Person;
  createdAt: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  sellerId?: Person;
  status: string;
}

interface HouseholdProfile {
  _id: string;
  name: string;
  relationship: string;
  isPrimary: boolean;
}

interface FriendRequest {
  _id: string;
  sender: Person;
  recipient: Person;
  status: string;
}

interface Offer {
  _id: string;
  product?: { title: string };
  amount: number;
  status: string;
}

interface Advertisement {
  _id: string;
  targetItem?: { title?: string };
  status: string;
  durationDays: number;
  adminNote?: string;
}

interface PortalData {
  me: Person | null;
  notices: Notice[];
  notifications: NotificationItem[];
  visitors: Visitor[];
  tickets: Ticket[];
  bills: Bill[];
  facilities: Facility[];
  reservations: Reservation[];
  areas: Area[];
  posts: Post[];
  products: Product[];
  householdProfiles: HouseholdProfile[];
  people: Person[];
  friendRequests: FriendRequest[];
  offers: Offer[];
  ads: Advertisement[];
}

const initialData: PortalData = {
  me: null,
  notices: [],
  notifications: [],
  visitors: [],
  tickets: [],
  bills: [],
  facilities: [],
  reservations: [],
  areas: [],
  posts: [],
  products: [],
  householdProfiles: [],
  people: [],
  friendRequests: [],
  offers: [],
  ads: [],
};

const navItems: Array<{
  id: Tab;
  label: string;
  icon: typeof Home;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "safety", label: "Safety", icon: ShieldAlert },
  { id: "community", label: "Community", icon: Users },
  { id: "services", label: "Services", icon: Wrench },
  { id: "market", label: "Market", icon: ShoppingBag },
  { id: "profile", label: "Profile", icon: UserRound },
];

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData) && options?.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api/resident/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message || "Request failed");
  }
  return (await response.json()) as T;
}

const SectionTitle = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Home;
  title: string;
  description: string;
}) => (
  <div className="mb-5 flex items-start gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-5" />
    </span>
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

export default function ResidentPortalClient() {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("home");
  const [data, setData] = useState<PortalData>(initialData);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [routeResult, setRouteResult] = useState("");
  const [visitorForm, setVisitorForm] = useState({
    name: "",
    phoneNumber: "",
    purpose: "",
    visitDate: "",
    type: "GUEST",
  });
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    type: "OTHER",
    priority: "MEDIUM",
  });
  const [bookingForm, setBookingForm] = useState({
    facilityId: "",
    date: "",
    durationInHours: "1",
  });
  const [routeForm, setRouteForm] = useState({
    startAreaId: "",
    endAreaId: "",
  });
  const [postText, setPostText] = useState("");
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "OTHER",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    relationship: "OTHER",
  });
  const [paymentProvider, setPaymentProvider] = useState("STRIPE");
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [incidentText, setIncidentText] = useState("");
  const [incidentFiles, setIncidentFiles] = useState<File[]>([]);
  const [postFiles, setPostFiles] = useState<File[]>([]);
  const [listingFiles, setListingFiles] = useState<File[]>([]);
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);
  const [noticeComments, setNoticeComments] = useState<Record<string, string>>(
    {}
  );
  const [postComments, setPostComments] = useState<Record<string, string>>({});
  const [ticketRatings, setTicketRatings] = useState<Record<string, string>>(
    {}
  );
  const [editingPostId, setEditingPostId] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [editingReservationId, setEditingReservationId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("ALL");
  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: "RESIDENTS",
    messagePermission: "EVERYONE",
    discoverable: true,
    showEmail: false,
    showPhone: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const requests = await Promise.allSettled([
      api<{ user: Person }>("users/me"),
      api<Notice[]>("announcements"),
      api<{ notifications: NotificationItem[] }>("notifications"),
      api<Visitor[]>("visitors/resident"),
      api<Ticket[]>("maintenance_tickets/user"),
      api<{ bills: Bill[] }>("bills/user?limit=100"),
      api<Facility[]>("facilities"),
      api<Reservation[]>("reservations"),
      api<{ areas: Area[] }>("areas"),
      api<Post[]>("posts"),
      api<Product[]>("products"),
      api<{ profiles: HouseholdProfile[] }>("users/household-profiles"),
      api<Person[]>("users"),
      api<FriendRequest[]>("friend-requests"),
      api<Offer[]>("offers/mine"),
      api<{ ads: Advertisement[] }>("ads/my-ads"),
    ]);
    const value = <T,>(index: number, fallback: T): T =>
      requests[index].status === "fulfilled"
        ? (requests[index].value as T)
        : fallback;
    setData({
      me: value(0, { user: null as unknown as Person }).user,
      notices: value<Notice[]>(1, []),
      notifications: value(2, { notifications: [] }).notifications,
      visitors: value<Visitor[]>(3, []),
      tickets: value<Ticket[]>(4, []),
      bills: value(5, { bills: [] }).bills,
      facilities: value<Facility[]>(6, []),
      reservations: value<Reservation[]>(7, []),
      areas: value(8, { areas: [] }).areas,
      posts: value<Post[]>(9, []),
      products: value<Product[]>(10, []),
      householdProfiles: value(11, { profiles: [] }).profiles,
      people: value<Person[]>(12, []),
      friendRequests: value<FriendRequest[]>(13, []),
      offers: value<Offer[]>(14, []),
      ads: value(15, { ads: [] }).ads,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setMessage(null);
    try {
      await work();
      setMessage({ kind: "success", text: "Saved successfully." });
      await load();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setBusy("");
    }
  };

  const unread = data.notifications.filter((item) => !item.isRead).length;
  const outstanding = useMemo(
    () =>
      data.bills
        .filter((bill) => bill.paymentStatus !== "PAID")
        .reduce((sum, bill) => sum + Number(bill.amount), 0),
    [data.bills]
  );
  const visibleProducts = useMemo(
    () =>
      data.products.filter(
        (product) =>
          (productCategory === "ALL" ||
            product.category === productCategory) &&
          `${product.title} ${product.description}`
            .toLowerCase()
            .includes(productSearch.toLowerCase())
      ),
    [data.products, productCategory, productSearch]
  );
  const productCategories = useMemo(
    () => [
      "ALL",
      ...new Set(data.products.map((product) => product.category)),
    ],
    [data.products]
  );

  const triggerSos = () =>
    run("sos", async () => {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
          })
      );
      await api("emergencies/trigger", {
        method: "POST",
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
    });

  const submitVisitor = (event: FormEvent) => {
    event.preventDefault();
    run("visitor", async () => {
      const start = new Date(visitorForm.visitDate);
      await api("visitors", {
        method: "POST",
        body: JSON.stringify({
          ...visitorForm,
          visitDate: start.toISOString(),
          validUntil: new Date(start.getTime() + 8 * 60 * 60 * 1000),
        }),
      });
      setVisitorForm({
        name: "",
        phoneNumber: "",
        purpose: "",
        visitDate: "",
        type: "GUEST",
      });
    });
  };

  const submitTicket = (event: FormEvent) => {
    event.preventDefault();
    run("ticket", async () => {
      const body = new FormData();
      Object.entries(ticketForm).forEach(([key, value]) =>
        body.set(key, value)
      );
      ticketFiles.forEach((file) => body.append("attachments", file));
      await api("maintenance_tickets", {
        method: "POST",
        body,
      });
      setTicketForm({
        title: "",
        description: "",
        type: "OTHER",
        priority: "MEDIUM",
      });
      setTicketFiles([]);
    });
  };

  const submitBooking = (event: FormEvent) => {
    event.preventDefault();
    run("booking", async () => {
      await api(
        editingReservationId
          ? `reservations/${editingReservationId}`
          : "reservations",
        {
        method: editingReservationId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...bookingForm,
          date: new Date(bookingForm.date).toISOString(),
          durationInHours: Number(bookingForm.durationInHours),
        }),
        }
      );
      setEditingReservationId("");
    });
  };

  const calculateRoute = (event: FormEvent) => {
    event.preventDefault();
    run("route", async () => {
      const result = await api<{
        guidance: string;
        totalDistanceMeters: number;
      }>("areas/safe-route", {
        method: "POST",
        body: JSON.stringify(routeForm),
      });
      setRouteResult(
        `${result.guidance} Distance: ${result.totalDistanceMeters} metres.`
      );
    });
  };

  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    run("post", async () => {
      if (editingPostId) {
        await api(`posts/${editingPostId}`, {
          method: "PUT",
          body: JSON.stringify({ description: postText }),
        });
      } else {
        const body = new FormData();
        body.set("description", postText);
        postFiles.forEach((file) => body.append("images", file));
        await api("posts", { method: "POST", body });
      }
      setPostText("");
      setPostFiles([]);
      setEditingPostId("");
    });
  };

  const submitListing = (event: FormEvent) => {
    event.preventDefault();
    run("listing", async () => {
      if (editingProductId) {
        await api(`products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify({
            ...listingForm,
            price: Number(listingForm.price),
          }),
        });
      } else {
        const body = new FormData();
        Object.entries(listingForm).forEach(([key, value]) =>
          body.set(key, value)
        );
        listingFiles.forEach((file) => body.append("images", file));
        await api("products", { method: "POST", body });
      }
      setListingForm({
        title: "",
        description: "",
        price: "",
        category: "OTHER",
      });
      setListingFiles([]);
      setEditingProductId("");
    });
  };

  const addProfile = (event: FormEvent) => {
    event.preventDefault();
    run("profile", async () => {
      await api("users/household-profiles", {
        method: "POST",
        body: JSON.stringify(profileForm),
      });
      setProfileForm({ name: "", relationship: "OTHER" });
    });
  };

  const submitIncident = (event: FormEvent) => {
    event.preventDefault();
    run("incident", async () => {
      const body = new FormData();
      body.set("type", "INCIDENT");
      body.set("reason", incidentText);
      incidentFiles.forEach((file) => body.append("media", file));
      await api("reports", { method: "POST", body });
      setIncidentText("");
      setIncidentFiles([]);
    });
  };

  const createGroup = (event: FormEvent) => {
    event.preventDefault();
    run("group", async () => {
      await api("chat/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName,
          participantIds: groupMembers,
        }),
      });
      setGroupName("");
      setGroupMembers([]);
    });
  };

  const startPayment = (bill: Bill) =>
    run(`payment-${bill._id}`, async () => {
      const result = await api<{
        checkoutUrl?: string;
        approvalUrl?: string;
        message?: string;
      }>(`bills/${bill._id}/payments`, {
        method: "POST",
        body: JSON.stringify({ provider: paymentProvider }),
      });
      const redirectUrl = result.checkoutUrl || result.approvalUrl;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
      } else {
        setMessage({
          kind: "success",
          text:
            result.message ||
            "Payment submitted for administrator confirmation.",
        });
      }
    });

  if (loading && !data.me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8f8]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f8f8] text-slate-900 dark:bg-background dark:text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:bg-card/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <span className="brand-mark size-9">
            <Shield className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">Guardora</p>
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Resident portal
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setTab("home")}
              aria-label={`${unread} unread notifications`}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => load()}>
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[220px_1fr] lg:pb-8">
        <aside className="hidden lg:block">
          <div className="sticky top-22 rounded-2xl border bg-white p-3 shadow-sm dark:bg-card">
            <div className="mb-3 rounded-xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-white/60">Signed in as</p>
              <p className="mt-1 truncate font-semibold">
                {data.me?.name || "Resident"}
              </p>
              <p className="text-xs text-white/60">
                Unit {data.me?.unitNumber || "—"}
              </p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      tab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          {message && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                message.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {tab === "home" && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
                <div className="grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <Badge className="mb-4 border-white/15 bg-white/10 text-white">
                      <span className="mr-2 size-1.5 rounded-full bg-emerald-400" />
                      Community protected
                    </Badge>
                    <h1 className="max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                      Good day, {data.me?.name?.split(" ")[0] || "Resident"}.
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                      Safety, visitors, community and essential services in one
                      secure place.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={triggerSos}
                    disabled={busy === "sos"}
                    className="shadow-lg"
                  >
                    {busy === "sos" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Siren />
                    )}
                    Emergency SOS
                  </Button>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Unread updates",
                    value: unread,
                    icon: Bell,
                  },
                  {
                    label: "Active visitors",
                    value: data.visitors.filter((v) =>
                      ["ACTIVE", "CHECKED_IN"].includes(v.status)
                    ).length,
                    icon: UserRound,
                  },
                  {
                    label: "Outstanding dues",
                    value: `PKR ${outstanding.toLocaleString()}`,
                    icon: CircleDollarSign,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                  >
                    <metric.icon className="mb-4 size-5 text-primary" />
                    <p className="text-2xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <SectionTitle
                    icon={Megaphone}
                    title="Notice board"
                    description="Latest official community updates"
                  />
                  <div className="space-y-3">
                    {data.notices.slice(0, 5).map((notice) => (
                      <article
                        key={notice._id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-border"
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{notice.title}</p>
                          {notice.isUrgent && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          {notice.kind === "POLL" && (
                            <Badge variant="outline">Poll</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {notice.description}
                        </p>
                        {notice.kind === "ANNOUNCEMENT" && (
                          <div className="mt-3 flex gap-2">
                            <Input
                              aria-label={`Comment on ${notice.title}`}
                              placeholder="Add comment"
                              value={noticeComments[notice._id] || ""}
                              onChange={(event) =>
                                setNoticeComments((current) => ({
                                  ...current,
                                  [notice._id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!noticeComments[notice._id]}
                              onClick={() =>
                                run(`notice-${notice._id}`, async () => {
                                  await api(
                                    `announcements/${notice._id}/comments`,
                                    {
                                      method: "POST",
                                      body: JSON.stringify({
                                        text: noticeComments[notice._id],
                                      }),
                                    }
                                  );
                                  setNoticeComments((current) => ({
                                    ...current,
                                    [notice._id]: "",
                                  }));
                                })
                              }
                            >
                              Comment
                            </Button>
                          </div>
                        )}
                      </article>
                    ))}
                    {!data.notices.length && <Empty>No active notices.</Empty>}
                  </div>
                </section>

                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <SectionTitle
                    icon={Bell}
                    title="Notifications"
                    description="Activity that needs your attention"
                  />
                  <div className="space-y-3">
                    {data.notifications.slice(0, 6).map((notification) => (
                      <div
                        key={notification._id}
                        className="flex gap-3 rounded-xl border p-3"
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            notification.isRead ? "bg-slate-300" : "bg-primary"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!data.notifications.length && (
                      <Empty>You are all caught up.</Empty>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === "safety" && (
            <div className="space-y-6">
              <SectionTitle
                icon={ShieldAlert}
                title="Safety centre"
                description="Emergency support, visitor access and safe navigation"
              />
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Emergency assistance</h3>
                      <p className="text-sm text-muted-foreground">
                        Shares your current GPS location with security.
                      </p>
                    </div>
                    <Siren className="size-6 text-red-500" />
                  </div>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    onClick={triggerSos}
                    disabled={busy === "sos"}
                  >
                    {busy === "sos" && <Loader2 className="animate-spin" />}
                    Activate SOS
                  </Button>
                </section>

                <form
                  onSubmit={calculateRoute}
                  className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                >
                  <h3 className="font-semibold">Safest internal route</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Active high-risk areas are automatically avoided.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      required
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={routeForm.startAreaId}
                      onChange={(event) =>
                        setRouteForm((current) => ({
                          ...current,
                          startAreaId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Starting area</option>
                      {data.areas.map((area) => (
                        <option key={area._id} value={area._id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                    <select
                      required
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={routeForm.endAreaId}
                      onChange={(event) =>
                        setRouteForm((current) => ({
                          ...current,
                          endAreaId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Destination</option>
                      {data.areas.map((area) => (
                        <option key={area._id} value={area._id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button className="mt-3 w-full" disabled={busy === "route"}>
                    <Route />
                    Calculate safe route
                  </Button>
                  {routeResult && (
                    <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                      {routeResult}
                    </p>
                  )}
                </form>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <form
                  onSubmit={submitVisitor}
                  className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                >
                  <h3 className="font-semibold">Create visitor pass</h3>
                  <div className="mt-4 space-y-3">
                    <Input
                      required
                      placeholder="Visitor name"
                      value={visitorForm.name}
                      onChange={(event) =>
                        setVisitorForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <Input
                      required
                      placeholder="Phone number"
                      value={visitorForm.phoneNumber}
                      onChange={(event) =>
                        setVisitorForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                    />
                    <Input
                      required
                      type="datetime-local"
                      value={visitorForm.visitDate}
                      onChange={(event) =>
                        setVisitorForm((current) => ({
                          ...current,
                          visitDate: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Purpose"
                      value={visitorForm.purpose}
                      onChange={(event) =>
                        setVisitorForm((current) => ({
                          ...current,
                          purpose: event.target.value,
                        }))
                      }
                    />
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={visitorForm.type}
                      onChange={(event) =>
                        setVisitorForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                    >
                      {["GUEST", "SERVICE", "DELIVERY", "RIDE"].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <Button className="w-full" disabled={busy === "visitor"}>
                      <Plus />
                      Generate pass
                    </Button>
                  </div>
                </form>

                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <h3 className="mb-4 font-semibold">My visitor passes</h3>
                  <div className="space-y-3">
                    {data.visitors.map((visitor) => (
                      <div
                        key={visitor._id}
                        className="flex items-center gap-4 rounded-xl border p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{visitor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(visitor.visitDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold tracking-wider">
                            {visitor.entryCode}
                          </p>
                          <Badge variant="outline">{visitor.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {!data.visitors.length && (
                      <Empty>No visitor passes yet.</Empty>
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                <h3 className="mb-4 font-semibold">Area status</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {data.areas.map((area) => (
                    <div key={area._id} className="rounded-xl border p-4">
                      <span
                        className={`mb-3 block size-2 rounded-full ${
                          area.isSafe ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <p className="font-semibold">{area.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {area.isSafe
                          ? "No active risk"
                          : area.riskReason || area.riskLevel}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-2 px-0 text-xs text-muted-foreground"
                        onClick={() =>
                          run(`area-report-${area._id}`, async () => {
                            await api(`areas/${area._id}/reports`, {
                              method: "POST",
                              body: JSON.stringify({
                                reason:
                                  "Resident reported a possible safety issue in this area.",
                              }),
                            });
                          })
                        }
                      >
                        Report issue here
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              <form
                onSubmit={submitIncident}
                className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-primary" />
                  <h3 className="font-semibold">Report a safety incident</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Security receives this report in the incident console.
                </p>
                <Textarea
                  required
                  className="mt-4"
                  placeholder="Describe what happened and where…"
                  value={incidentText}
                  onChange={(event) => setIncidentText(event.target.value)}
                />
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) =>
                    setIncidentFiles(Array.from(event.target.files || []))
                  }
                />
                <Button className="mt-3" disabled={busy === "incident"}>
                  Submit incident
                </Button>
              </form>
            </div>
          )}

          {tab === "community" && (
            <div className="space-y-6">
              <SectionTitle
                icon={MessageCircle}
                title="Community"
                description="Share updates and take part in resident polls"
              />
              <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                <div className="space-y-6">
                  <form
                    onSubmit={submitPost}
                    className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                  >
                    <h3 className="font-semibold">
                      {editingPostId ? "Edit post" : "Create a post"}
                    </h3>
                    <Textarea
                      required
                      className="mt-4 min-h-28"
                      placeholder="Share something useful with your community…"
                      value={postText}
                      onChange={(event) => setPostText(event.target.value)}
                    />
                    {!editingPostId && (
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setPostFiles(Array.from(event.target.files || []))
                        }
                      />
                    )}
                    <Button className="mt-3 w-full" disabled={busy === "post"}>
                      {editingPostId ? "Save changes" : "Publish post"}
                    </Button>
                    {editingPostId && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 w-full"
                        onClick={() => {
                          setEditingPostId("");
                          setPostText("");
                        }}
                      >
                        Cancel edit
                      </Button>
                    )}
                  </form>

                  <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Resident directory</h3>
                        <p className="text-xs text-muted-foreground">
                          Follow, connect or start a private chat.
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a href="/messages">Inbox</a>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {data.people
                        .filter((person) => person._id !== data.me?._id)
                        .slice(0, 8)
                        .map((person) => (
                          <div
                            key={person._id}
                            className="flex items-center gap-3 rounded-xl border p-3"
                          >
                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {person.name.slice(0, 1)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {person.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Unit {person.unitNumber || "—"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                run(`friend-${person._id}`, async () => {
                                  await api(
                                    `friend-requests/${person._id}`,
                                    { method: "POST" }
                                  );
                                })
                              }
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                run(`follow-${person._id}`, async () => {
                                  await api(`users/follow/${person._id}`, {
                                    method: "POST",
                                  });
                                })
                              }
                            >
                              Follow
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() =>
                                run(`block-${person._id}`, async () => {
                                  await api(`users/block/${person._id}`, {
                                    method: "POST",
                                  });
                                })
                              }
                            >
                              Block
                            </Button>
                            <Button asChild type="button" size="sm">
                              <a href={`/chat/${person._id}`}>Chat</a>
                            </Button>
                          </div>
                        ))}
                    </div>
                    <form
                      onSubmit={createGroup}
                      className="mt-4 rounded-xl border bg-muted/20 p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        New group chat
                      </p>
                      <Input
                        required
                        className="mt-3"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                      />
                      <div className="mt-3 max-h-32 space-y-2 overflow-y-auto">
                        {data.people
                          .filter((person) => person._id !== data.me?._id)
                          .map((person) => (
                            <label
                              key={person._id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={groupMembers.includes(person._id)}
                                onChange={(event) =>
                                  setGroupMembers((current) =>
                                    event.target.checked
                                      ? [...current, person._id]
                                      : current.filter(
                                          (id) => id !== person._id
                                        )
                                  )
                                }
                              />
                              {person.name}
                            </label>
                          ))}
                      </div>
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        disabled={
                          busy === "group" || groupMembers.length < 2
                        }
                      >
                        Create group
                      </Button>
                    </form>
                    {!!data.friendRequests.length && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Pending requests
                        </p>
                        {data.friendRequests.map((request) => {
                          const incoming =
                            request.recipient?._id === data.me?._id;
                          const person = incoming
                            ? request.sender
                            : request.recipient;
                          return (
                            <div
                              key={request._id}
                              className="flex items-center gap-2 rounded-lg border p-2 text-xs"
                            >
                              <span className="flex-1">
                                {person?.name || "Resident"} ·{" "}
                                {incoming ? "Incoming" : "Sent"}
                              </span>
                              {incoming && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      run(
                                        `friend-accept-${request._id}`,
                                        async () => {
                                          await api(
                                            `friend-requests/${request._id}/respond`,
                                            {
                                              method: "PATCH",
                                              body: JSON.stringify({
                                                status: "ACCEPTED",
                                              }),
                                            }
                                          );
                                        }
                                      )
                                    }
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      run(
                                        `friend-reject-${request._id}`,
                                        async () => {
                                          await api(
                                            `friend-requests/${request._id}/respond`,
                                            {
                                              method: "PATCH",
                                              body: JSON.stringify({
                                                status: "REJECTED",
                                              }),
                                            }
                                          );
                                        }
                                      )
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="mb-4 flex items-center gap-2">
                      <Vote className="size-5 text-primary" />
                      <h3 className="font-semibold">Open polls</h3>
                    </div>
                    <div className="space-y-4">
                      {data.notices
                        .filter((notice) => notice.kind === "POLL")
                        .map((poll) => (
                          <div key={poll._id} className="rounded-xl border p-4">
                            <p className="font-semibold">{poll.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {poll.description}
                            </p>
                            <div className="mt-3 space-y-2">
                              {poll.pollOptions?.map((option) => (
                                <Button
                                  key={option._id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-between"
                                  onClick={() =>
                                    run(`vote-${poll._id}`, async () => {
                                      await api(
                                        `announcements/${poll._id}/vote`,
                                        {
                                          method: "POST",
                                          body: JSON.stringify({
                                            optionId: option._id,
                                          }),
                                        }
                                      );
                                    })
                                  }
                                >
                                  {option.text}
                                  <span>{option.voters.length}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      {!data.notices.some(
                        (notice) => notice.kind === "POLL"
                      ) && <Empty>No open polls.</Empty>}
                    </div>
                  </section>
                </div>

                <section className="space-y-4">
                  {data.posts.map((post) => (
                    <article
                      key={post._id}
                      className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(post.author?.name || "R").slice(0, 1)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">
                            {post.author?.name || "Resident"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unit {post.author?.unitNumber || "—"} ·{" "}
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
                        {post.description}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() =>
                          run(`like-${post._id}`, async () => {
                            await api(`posts/${post._id}/like`, {
                              method: "POST",
                            });
                          })
                        }
                      >
                        <HeartHandshake />
                        {post.totalLikes} likes
                      </Button>
                      {post.author?._id === data.me?._id && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPostId(post._id);
                              setPostText(post.description);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              run(`delete-post-${post._id}`, async () => {
                                await api(`posts/${post._id}`, {
                                  method: "DELETE",
                                });
                              })
                            }
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <div className="mt-3 flex gap-2 border-t pt-3">
                        <Input
                          aria-label={`Comment on post by ${post.author?.name || "resident"}`}
                          placeholder={`${post.totalComments || 0} comments · Add yours`}
                          value={postComments[post._id] || ""}
                          onChange={(event) =>
                            setPostComments((current) => ({
                              ...current,
                              [post._id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!postComments[post._id]}
                          onClick={() =>
                            run(`post-comment-${post._id}`, async () => {
                              await api(`comments/post/${post._id}`, {
                                method: "POST",
                                body: JSON.stringify({
                                  text: postComments[post._id],
                                }),
                              });
                              setPostComments((current) => ({
                                ...current,
                                [post._id]: "",
                              }));
                            })
                          }
                        >
                          Comment
                        </Button>
                      </div>
                    </article>
                  ))}
                  {!data.posts.length && <Empty>No community posts yet.</Empty>}
                </section>
              </div>
            </div>
          )}

          {tab === "services" && (
            <div className="space-y-6">
              <SectionTitle
                icon={Wrench}
                title="Resident services"
                description="Maintenance, facilities, bookings and billing"
              />
              <div className="grid gap-6 xl:grid-cols-2">
                <form
                  onSubmit={submitTicket}
                  className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                >
                  <h3 className="font-semibold">Request maintenance</h3>
                  <div className="mt-4 space-y-3">
                    <Input
                      required
                      placeholder="Issue title"
                      value={ticketForm.title}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      required
                      placeholder="Describe the issue"
                      value={ticketForm.description}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={ticketForm.type}
                        onChange={(event) =>
                          setTicketForm((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                      >
                        {[
                          "ELECTRICITY",
                          "CLEANING",
                          "PLUMBING",
                          "HANDYWORK",
                          "OTHER",
                        ].map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={ticketForm.priority}
                        onChange={(event) =>
                          setTicketForm((current) => ({
                            ...current,
                            priority: event.target.value,
                          }))
                        }
                      >
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((priority) => (
                          <option key={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(event) =>
                        setTicketFiles(Array.from(event.target.files || []))
                      }
                    />
                    <Button className="w-full" disabled={busy === "ticket"}>
                      <ClipboardList />
                      Submit request
                    </Button>
                  </div>
                </form>

                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <h3 className="mb-4 font-semibold">My requests</h3>
                  <div className="space-y-3">
                    {data.tickets.slice(0, 6).map((ticket) => (
                      <div key={ticket._id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{ticket.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ticket.type} · {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                        {ticket.status === "COMPLETED" && (
                          <div className="mt-3 flex gap-2 border-t pt-3">
                            <select
                              aria-label={`Rating for ${ticket.title}`}
                              className="h-9 flex-1 rounded-md border bg-background px-2 text-xs"
                              value={ticketRatings[ticket._id] || "5"}
                              onChange={(event) =>
                                setTicketRatings((current) => ({
                                  ...current,
                                  [ticket._id]: event.target.value,
                                }))
                              }
                            >
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>
                                  {rating} stars
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                run(`rating-${ticket._id}`, async () => {
                                  await api(
                                    `maintenance_tickets/${ticket._id}/feedback`,
                                    {
                                      method: "POST",
                                      body: JSON.stringify({
                                        rating: Number(
                                          ticketRatings[ticket._id] || 5
                                        ),
                                      }),
                                    }
                                  );
                                })
                              }
                            >
                              Rate
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {!data.tickets.length && (
                      <Empty>No maintenance requests.</Empty>
                    )}
                  </div>
                </section>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <form
                  onSubmit={submitBooking}
                  className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                >
                  <h3 className="font-semibold">
                    {editingReservationId
                      ? "Modify reservation"
                      : "Book a facility"}
                  </h3>
                  <div className="mt-4 space-y-3">
                    <select
                      required
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={bookingForm.facilityId}
                      onChange={(event) =>
                        setBookingForm((current) => ({
                          ...current,
                          facilityId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choose facility</option>
                      {data.facilities.map((facility) => (
                        <option key={facility._id} value={facility._id}>
                          {facility.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      required
                      type="datetime-local"
                      value={bookingForm.date}
                      onChange={(event) =>
                        setBookingForm((current) => ({
                          ...current,
                          date: event.target.value,
                        }))
                      }
                    />
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={bookingForm.durationInHours}
                      onChange={(event) =>
                        setBookingForm((current) => ({
                          ...current,
                          durationInHours: event.target.value,
                        }))
                      }
                    >
                      {["0.5", "1", "1.5", "2"].map((duration) => (
                        <option key={duration} value={duration}>
                          {duration} hours
                        </option>
                      ))}
                    </select>
                    <Button className="w-full" disabled={busy === "booking"}>
                      <CalendarDays />
                      {editingReservationId ? "Save booking" : "Confirm booking"}
                    </Button>
                    {editingReservationId && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setEditingReservationId("")}
                      >
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </form>

                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <h3 className="mb-4 font-semibold">Facilities</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.facilities.map((facility) => (
                      <div key={facility._id} className="rounded-xl border p-4">
                        <Building2 className="mb-3 size-5 text-primary" />
                        <p className="font-semibold">{facility.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {facility.description}
                        </p>
                        <p className="mt-3 text-xs font-medium">
                          {facility.openTime}–{facility.closeTime}
                          {facility.isPaidService
                            ? ` · PKR ${facility.pricePerHour}/hr`
                            : " · Free"}
                        </p>
                      </div>
                    ))}
                  </div>
                  {!!data.reservations.length && (
                    <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                      {data.reservations.slice(0, 5).map((reservation) => (
                        <div
                          key={reservation._id}
                          className="flex items-center justify-between gap-3"
                        >
                          <span>
                            <strong>
                              {reservation.facilityId?.name || "Facility"}
                            </strong>{" "}
                            · {formatDate(reservation.date)} ·{" "}
                            {reservation.status}
                          </span>
                          {reservation.status === "CONFIRMED" && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingReservationId(reservation._id);
                                  setBookingForm({
                                    facilityId:
                                      reservation.facilityId?._id || "",
                                    date: new Date(reservation.date)
                                      .toISOString()
                                      .slice(0, 16),
                                    durationInHours: "1",
                                  });
                                }}
                              >
                                Modify
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  run(
                                    `cancel-${reservation._id}`,
                                    async () => {
                                      await api(
                                        `reservations/${reservation._id}`,
                                        { method: "DELETE" }
                                      );
                                    }
                                  )
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Bills and statements</h3>
                    <p className="text-sm text-muted-foreground">
                      Secure resident-scoped payment records
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      aria-label="Payment provider"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={paymentProvider}
                      onChange={(event) =>
                        setPaymentProvider(event.target.value)
                      }
                    >
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
                      <option value="CASH">Cash</option>
                    </select>
                    <Button asChild variant="outline">
                      <a href="/api/resident/bills/user/statement.pdf">
                        Download statement
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.bills.map((bill) => (
                    <div
                      key={bill._id}
                      className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
                    >
                      <CircleDollarSign className="size-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {bill.month} · Due {formatDate(bill.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          PKR {Number(bill.amount).toLocaleString()}
                        </p>
                        <Badge variant="outline">{bill.paymentStatus}</Badge>
                      </div>
                      {bill.paymentStatus === "PAID" && (
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={`/api/resident/bills/${bill._id}/receipt.pdf`}
                          >
                            Receipt
                          </a>
                        </Button>
                      )}
                      {bill.paymentStatus !== "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => startPayment(bill)}
                          disabled={busy === `payment-${bill._id}`}
                        >
                          {busy === `payment-${bill._id}` && (
                            <Loader2 className="animate-spin" />
                          )}
                          Pay / submit
                        </Button>
                      )}
                    </div>
                  ))}
                  {!data.bills.length && <Empty>No billing records.</Empty>}
                </div>
              </section>
            </div>
          )}

          {tab === "market" && (
            <div className="space-y-6">
              <SectionTitle
                icon={ShoppingBag}
                title="Resident marketplace"
                description="Buy, sell and discover items within the community"
              />
              <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                <form
                  onSubmit={submitListing}
                  className="h-fit rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                >
                  <h3 className="font-semibold">
                    {editingProductId ? "Edit listing" : "Create listing"}
                  </h3>
                  <div className="mt-4 space-y-3">
                    <Input
                      required
                      placeholder="Item title"
                      value={listingForm.title}
                      onChange={(event) =>
                        setListingForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      required
                      placeholder="Description"
                      value={listingForm.description}
                      onChange={(event) =>
                        setListingForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <Input
                      required
                      type="number"
                      min="0"
                      placeholder="Price (PKR)"
                      value={listingForm.price}
                      onChange={(event) =>
                        setListingForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                    <Input
                      required
                      placeholder="Category"
                      value={listingForm.category}
                      onChange={(event) =>
                        setListingForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    />
                    {!editingProductId && (
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setListingFiles(Array.from(event.target.files || []))
                        }
                      />
                    )}
                    <Button className="w-full" disabled={busy === "listing"}>
                      <Plus />
                      {editingProductId ? "Save listing" : "Publish listing"}
                    </Button>
                    {editingProductId && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setEditingProductId("")}
                      >
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </form>

                <section>
                  <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
                    <Input
                      type="search"
                      placeholder="Search marketplace"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                    />
                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={productCategory}
                      onChange={(event) =>
                        setProductCategory(event.target.value)
                      }
                    >
                      {productCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {visibleProducts.map((product) => (
                    <article
                      key={product._id}
                      className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card"
                    >
                      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <PackageSearch className="size-5" />
                      </span>
                      <Badge variant="outline">{product.category}</Badge>
                      <h3 className="mt-3 font-semibold">{product.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {product.description}
                      </p>
                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">
                            PKR {Number(product.price).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.sellerId?.name || "Resident"} · Unit{" "}
                            {product.sellerId?.unitNumber || "—"}
                          </p>
                        </div>
                        {product.sellerId?._id && (
                          <Button asChild size="sm" variant="outline">
                            <a href={`/chat/${product.sellerId._id}`}>Contact</a>
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2 border-t pt-4">
                        <Input
                          type="number"
                          min="0"
                          aria-label={`Offer for ${product.title}`}
                          placeholder="Your offer"
                          value={offerAmounts[product._id] || ""}
                          onChange={(event) =>
                            setOfferAmounts((current) => ({
                              ...current,
                              [product._id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            !offerAmounts[product._id] ||
                            busy === `offer-${product._id}`
                          }
                          onClick={() =>
                            run(`offer-${product._id}`, async () => {
                              await api("offers", {
                                method: "POST",
                                body: JSON.stringify({
                                  productId: product._id,
                                  amount: Number(offerAmounts[product._id]),
                                }),
                              });
                              setOfferAmounts((current) => ({
                                ...current,
                                [product._id]: "",
                              }));
                            })
                          }
                        >
                          Offer
                        </Button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {product.sellerId?._id === data.me?._id ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingProductId(product._id);
                                setListingForm({
                                  title: product.title,
                                  description: product.description,
                                  price: String(product.price),
                                  category: product.category,
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                run(`ad-${product._id}`, async () => {
                                  await api("ads/apply", {
                                    method: "POST",
                                    body: JSON.stringify({
                                      targetId: product._id,
                                      type: "Product",
                                      durationDays: 7,
                                    }),
                                  });
                                })
                              }
                            >
                              Promote 7 days
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() =>
                                run(`delete-product-${product._id}`, async () => {
                                  await api(`products/${product._id}`, {
                                    method: "DELETE",
                                  });
                                })
                              }
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-muted-foreground"
                            onClick={() =>
                              run(`report-product-${product._id}`, async () => {
                                const body = new FormData();
                                body.set("type", "MARKET_PRODUCT");
                                body.set("targetId", product._id);
                                body.set(
                                  "reason",
                                  "Resident requested a fraud/safety review."
                                );
                                await api("reports", { method: "POST", body });
                              })
                            }
                          >
                            Report listing
                          </Button>
                        )}
                      </div>
                    </article>
                    ))}
                    {!visibleProducts.length && (
                      <Empty>No available listings.</Empty>
                    )}
                  </div>
                </section>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <h3 className="mb-4 font-semibold">Offer history</h3>
                  <div className="space-y-2">
                    {data.offers.map((offer) => (
                      <div
                        key={offer._id}
                        className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                      >
                        <span>
                          {offer.product?.title || "Marketplace item"} · PKR{" "}
                          {Number(offer.amount).toLocaleString()}
                        </span>
                        <Badge variant="outline">{offer.status}</Badge>
                      </div>
                    ))}
                    {!data.offers.length && <Empty>No offers yet.</Empty>}
                  </div>
                </section>
                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <h3 className="mb-4 font-semibold">Promotion applications</h3>
                  <div className="space-y-2">
                    {data.ads.map((ad) => (
                      <div key={ad._id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">
                            {ad.targetItem?.title || "Listing"} ·{" "}
                            {ad.durationDays} days
                          </span>
                          <Badge variant="outline">{ad.status}</Badge>
                        </div>
                        {ad.adminNote && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {ad.adminNote}
                          </p>
                        )}
                        {ad.status === "REJECTED" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() =>
                              run(`ad-resubmit-${ad._id}`, async () => {
                                await api(`ads/${ad._id}/resubmit`, {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    durationDays: ad.durationDays,
                                  }),
                                });
                              })
                            }
                          >
                            Corrected — resubmit
                          </Button>
                        )}
                      </div>
                    ))}
                    {!data.ads.length && (
                      <Empty>No promotion applications.</Empty>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6">
              <SectionTitle
                icon={UserRound}
                title="Profile and household"
                description="Manage who can use your household account"
              />
              <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground">
                    {(data.me?.name || "R").slice(0, 1)}
                  </span>
                  <h2 className="mt-5 text-xl font-semibold">{data.me?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {data.me?.email}
                  </p>
                  <div className="mt-5 space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit</span>
                      <strong>{data.me?.unitNumber || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Access</span>
                      <strong>{data.me?.role || "RESIDENT"}</strong>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 border-t pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Appearance & privacy
                    </p>
                    <select
                      aria-label="Theme"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={theme || "system"}
                      onChange={(event) => setTheme(event.target.value)}
                    >
                      <option value="system">System theme</option>
                      <option value="light">Light theme</option>
                      <option value="dark">Dark theme</option>
                    </select>
                    <select
                      aria-label="Profile visibility"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={privacyForm.profileVisibility}
                      onChange={(event) =>
                        setPrivacyForm((current) => ({
                          ...current,
                          profileVisibility: event.target.value,
                        }))
                      }
                    >
                      <option value="RESIDENTS">Visible to residents</option>
                      <option value="FRIENDS">Friends only</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                    <select
                      aria-label="Message permission"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={privacyForm.messagePermission}
                      onChange={(event) =>
                        setPrivacyForm((current) => ({
                          ...current,
                          messagePermission: event.target.value,
                        }))
                      }
                    >
                      <option value="EVERYONE">Messages from residents</option>
                      <option value="FRIENDS">Messages from friends</option>
                      <option value="NONE">No new messages</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={privacyForm.discoverable}
                        onChange={(event) =>
                          setPrivacyForm((current) => ({
                            ...current,
                            discoverable: event.target.checked,
                          }))
                        }
                      />
                      Show me in the resident directory
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        run("privacy", async () => {
                          await api("users/privacy-settings", {
                            method: "PUT",
                            body: JSON.stringify(privacyForm),
                          });
                        })
                      }
                    >
                      Save privacy
                    </Button>
                  </div>
                </section>

                <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    <h3 className="font-semibold">Household profiles</h3>
                  </div>
                  <form
                    onSubmit={addProfile}
                    className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_160px_auto]"
                  >
                    <Input
                      required
                      placeholder="Profile name"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={profileForm.relationship}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          relationship: event.target.value,
                        }))
                      }
                    >
                      {[
                        "SELF",
                        "SPOUSE",
                        "CHILD",
                        "PARENT",
                        "SIBLING",
                        "OTHER",
                      ].map((relationship) => (
                        <option key={relationship}>{relationship}</option>
                      ))}
                    </select>
                    <Button disabled={busy === "profile"}>
                      <Plus />
                      Add
                    </Button>
                  </form>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {data.householdProfiles.map((profile) => (
                      <div key={profile._id} className="rounded-xl border p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {profile.name.slice(0, 1)}
                          </span>
                          <div>
                            <p className="font-semibold">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile.relationship}
                              {profile.isPrimary ? " · Primary" : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                          onClick={() =>
                            run(`profile-${profile._id}`, async () => {
                              await api(
                                `users/household-profiles/${profile._id}/select`,
                                { method: "PATCH" }
                              );
                            })
                          }
                        >
                          Use this profile
                        </Button>
                      </div>
                    ))}
                    {!data.householdProfiles.length && (
                      <Empty>No additional profiles.</Empty>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:bg-card/95 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium ${
                  tab === item.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
