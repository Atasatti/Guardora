import { getAdminAds } from "@/lib/actions/ads";
import { getAlerts } from "@/lib/actions/alerts";
import { getAllAnnouncements } from "@/lib/actions/announcements";
import { getAllAreas } from "@/lib/actions/areas";
import { getBannedPersons } from "@/lib/actions/banned";
import { getAllBills, getBillingStats } from "@/lib/actions/billing";
import { getInbox } from "@/lib/actions/chat";
import { getFacilities } from "@/lib/actions/facilities";
import { getMaintenanceTickets } from "@/lib/actions/maintenance";
import { getModerationCases } from "@/lib/actions/moderation";
import { getAllReports } from "@/lib/actions/reports";
import { getAllPosts, getAllProducts } from "@/lib/actions/social";
import {
  getAllUsers,
  getProfile,
  getUserProfileData,
} from "@/lib/actions/users";
import { getAllVisitors } from "@/lib/actions/visitors";
import { failed, ready, resultMessage } from "./view-state";

const DEFAULT_BILLING_STATS = {
  totalBills: 0,
  pendingBills: 0,
  clearedBills: 0,
  totalAmount: 0,
  pendingAmount: 0,
};

export async function loadDashboardViewModel() {
  const [
    alertResult,
    usersResult,
    visitorsResult,
    maintenanceResult,
    moderationResult,
    areasResult,
  ] = await Promise.all([
    getAlerts(),
    getAllUsers(),
    getAllVisitors(),
    getMaintenanceTickets(),
    getModerationCases(),
    getAllAreas(),
  ]);

  const users = usersResult.success ? usersResult.users || [] : [];
  const visitors = visitorsResult.success ? visitorsResult.visitors || [] : [];
  const maintenanceTickets = maintenanceResult.success
    ? maintenanceResult.tickets || []
    : [];
  const moderationCases = moderationResult.success
    ? moderationResult.cases || []
    : [];
  const areas = areasResult.success ? areasResult.areas || [] : [];
  const alerts = alertResult.success ? alertResult.alerts || [] : [];

  return ready({
    userCount: users.length,
    activeVisitors: visitors.filter((visitor) => visitor.status === "ACTIVE")
      .length,
    pendingMaintenance: maintenanceTickets.filter(
      (ticket) => ticket.status !== "COMPLETED"
    ).length,
    openModeration: moderationCases.filter(
      (moderationCase) => moderationCase.status === "OPEN"
    ).length,
    maintenanceTickets,
    moderationCases,
    areas,
    visitors,
    alerts: alerts.slice(0, 10),
  });
}

export async function loadAnalyticsViewModel() {
  const [alertsResult, visitorsResult, maintenanceResult] = await Promise.all([
    getAlerts(),
    getAllVisitors(),
    getMaintenanceTickets(),
  ]);

  return ready({
    visitors: visitorsResult.success ? visitorsResult.visitors || [] : [],
    tickets: maintenanceResult.success ? maintenanceResult.tickets || [] : [],
    alerts: alertsResult.success ? alertsResult.alerts || [] : [],
  });
}

export async function loadAdsViewModel() {
  const result = await getAdminAds();
  return result.success
    ? ready({ ads: result.ads || [] })
    : failed(resultMessage(result));
}

export async function loadAlertsViewModel() {
  const [alertsResult, bannedResult] = await Promise.all([
    getAlerts(),
    getBannedPersons(),
  ]);

  if (!alertsResult.success && !bannedResult.success) {
    return failed(resultMessage(alertsResult) || resultMessage(bannedResult));
  }

  return ready({
    alerts: alertsResult.success ? alertsResult.alerts || [] : [],
    bannedPersons: bannedResult.success ? bannedResult.persons || [] : [],
  });
}

export async function loadAnnouncementsViewModel() {
  const result = await getAllAnnouncements();
  return result.success
    ? ready({ announcements: result.announcements || [] })
    : failed(resultMessage(result));
}

export async function loadFacilitiesViewModel() {
  const result = await getFacilities();
  return result.success
    ? ready({ facilities: result.facilities || [] })
    : failed(resultMessage(result));
}

export async function loadBillingViewModel() {
  const [billsResult, statsResult] = await Promise.all([
    getAllBills(),
    getBillingStats(),
  ]);

  if (!billsResult.success || !statsResult.success) {
    return failed(resultMessage(billsResult) || resultMessage(statsResult));
  }

  return ready({
    bills: billsResult.bills || [],
    stats: statsResult.stats || DEFAULT_BILLING_STATS,
  });
}

export async function loadMaintenanceViewModel() {
  const result = await getMaintenanceTickets();
  return result.success
    ? ready({ tickets: result.tickets || [] })
    : failed(resultMessage(result));
}

export async function loadMapViewModel() {
  const result = await getAllAreas();
  return result.success
    ? ready({ areas: result.areas || [] })
    : failed(resultMessage(result));
}

export async function loadMessagesViewModel() {
  const result = await getInbox();
  return result.success
    ? ready({ conversations: result.conversations || [] })
    : failed(resultMessage(result));
}

export async function loadModerationViewModel() {
  const result = await getModerationCases();
  return result.success
    ? ready({ cases: result.cases || [] })
    : failed(resultMessage(result));
}

export async function loadReportsViewModel() {
  const result = await getAllReports();
  return result.success
    ? ready({ reports: result.reports || [] })
    : failed(resultMessage(result));
}

export async function loadSocialViewModel() {
  const [postsResult, productsResult] = await Promise.all([
    getAllPosts(),
    getAllProducts(),
  ]);

  if (!postsResult.success && !productsResult.success) {
    return failed(resultMessage(postsResult) || resultMessage(productsResult));
  }

  return ready({
    posts: postsResult.success ? postsResult.posts || [] : [],
    products: productsResult.success ? productsResult.products || [] : [],
  });
}

export async function loadSurveillanceViewModel() {
  const [alertsResult, areasResult] = await Promise.all([
    getAlerts(),
    getAllAreas(),
  ]);

  return ready({
    alerts: alertsResult.success ? alertsResult.alerts || [] : [],
    areas: areasResult.success ? areasResult.areas || [] : [],
  });
}

export async function loadUsersViewModel() {
  const [usersResult, reportsResult] = await Promise.all([
    getAllUsers(),
    getAllReports(),
  ]);

  if (!usersResult.success) {
    return failed(resultMessage(usersResult));
  }

  const reports = reportsResult.success ? reportsResult.reports || [] : [];

  return ready({
    users: usersResult.users || [],
    reports: reports.filter((report) => report.type === "PERSON"),
  });
}

export async function loadUserProfileViewModel(userId: string) {
  const result = await getUserProfileData(userId);
  return result.success
    ? ready({
        user: result.user,
        posts: result.posts,
        products: result.products,
      })
    : failed(result.message);
}

export async function loadVisitorsViewModel() {
  const result = await getAllVisitors();
  return result.success
    ? ready({ visitors: result.visitors || [] })
    : failed(resultMessage(result));
}

export async function loadSettingsViewModel() {
  const result = await getProfile();
  return result.success && result.user
    ? ready({ user: result.user })
    : failed(resultMessage(result) || "Please login to continue");
}
