// Framework-independent domain contracts for the web application.

export interface LoginResponse {
  success: boolean;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MODERATOR" | "RESIDENT";
  };
  token?: string;
  message?: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
}

export type UserProfileSuccess = {
  success: true;
  user: User;
  posts: Post[];
  products: Product[];
};

export type UserProfileError = {
  success: false;
  message: string;
};

export type UserProfileResponse = UserProfileSuccess | UserProfileError;
export type UserRole = "RESIDENT" | "ADMIN" | "MODERATOR";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type ModeratorPermission =
  | "MANAGE_USERS"
  | "MANAGE_SURVEILLANCE"
  | "MANAGE_VISITORS"
  | "MANAGE_ALERTS"
  | "MANAGE_CONTENT"
  | "MANAGE_MAINTENANCE"
  | "MANAGE_BILLING"
  | "MANAGE_FACILITIES"
  | "MANAGE_MAP"
  | "MANAGE_ADS";

// Based on your userModel.js
export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  unitNumber: string;
  profilePicture?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  permissions: ModeratorPermission[];
  isVerified: boolean;
  socialStats: {
    totalFollowers: number;
    totalFollowing: number;
    followers: string[];
    following: string[];
  };
  sellerStats: {
    totalProducts: number;
    itemsSold: number;
  };
  emergencyContact: {
    name?: string;
    phoneNumber?: string;
    relationship?: string;
  };
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

// Type for the data from adminGetAllUsers
export type UserSummary = Pick<
  User,
  | "_id"
  | "name"
  | "email"
  | "role"
  | "unitNumber"
  | "phoneNumber"
  | "profilePicture"
  | "createdAt"
>;

// Type for the "Create User" form
export type CreateUserFormData = {
  name: string;
  email: string;
  password?: string;
  phoneNumber: string;
  unitNumber: string;
  role: UserRole;
  profilePicture?: File;
};

// --- NEW TYPES FOR PROFILE PAGE ---
export interface Post {
  _id: string;
  description: string;
  images: string[];
  author: UserSummary; // Assuming populate returns a user object
  totalLikes: number;
  likes: string[];
  totalComments: number;
  comments: string[]; // Assuming comments are ObjectIds
  createdAt: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: UserSummary; // Assuming populate returns a user object
  category: string;
  status: "AVAILABLE" | "SOLD" | "RESERVED" | "DELETED";
  createdAt: string;
}

export type AlertType = "DANGEROUS_OBJECT" | "BANNED_PERSON" | "UNSAFE_AREA";

export type AlertStatus = "NEW" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface SecurityAlert {
  _id: string;
  type: AlertType;
  status: AlertStatus;
  cameraName: string;
  timestamp: string;
  snapshotBase64?: string;
  snapshotUrl?: string;
  details?: {
    object?: string;
    confidence?: number;
    personId?: string;
    personName?: string;
    name?: string;
  };
}

export interface AuditLog {
  _id: string;
  admin: Pick<User, "name" | "profilePicture">; // Use a partial User
  action: string;
  target: string;
  timestamp: string;
}

export interface Notification {
  _id: string;
  type:
    | "MESSAGE"
    | "ANNOUNCEMENT"
    | "EMERGENCY"
    | "MAINTENANCE"
    | "BILLING"
    | "VISITOR"
    | "SECURITY"
    | "AD"
    | "SYSTEM";
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface BannedPerson {
  _id: string;
  name: string;
  profilePicture: string;
  reason: string;
  addedBy: string;
  dateAdded: string;
}

export const TICKET_TYPES = [
  "ELECTRICITY",
  "CLEANING",
  "PLUMBING",
  "HANDYWORK",
  "OTHER",
] as const;

export const TICKET_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface MaintenanceTicket {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
  requester: UserSummary;
  assignedTo?: UserSummary | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  expectedResolutionAt?: string | null;
  feedback?: {
    rating?: number | null;
    comment?: string | null;
    submittedAt?: string | null;
  };
}

export interface CreateTicketData {
  title: string;
  requester: string;
  description: string;
  type: TicketType;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  type?: TicketType;
  closedAt?: string | null;
}

export interface Facility {
  _id: string;
  name: string;
  imageUrl: string;
  description: string;
  totalCapacity: number;
  availableCapacity: number;
  isPaidService: boolean;
  pricePerHour?: number;
  rules: string[];
  openTime: string;
  closeTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityData {
  name: string;
  imageUrl: string;
  description: string;
  totalCapacity: number;
  availableCapacity: number;
  isPaidService: boolean;
  pricePerHour?: number;
  rules: string[];
  openTime: string;
  closeTime: string;
}

export interface UpdateFacilityData {
  name?: string;
  imageUrl?: string;
  description?: string;
  totalCapacity?: number;
  availableCapacity?: number;
  isPaidService?: boolean;
  pricePerHour?: number;
  rules?: string[];
  openTime?: string;
  closeTime?: string;
}

export interface Reservation {
  _id: string;
  facilityId: string;
  residentId: string;
  date: string;
  durationInHours: number;
  createdAt: string;
  updatedAt: string;
  // We'll populate these with actual data
  facility?: Facility;
  resident?: UserSummary;
}

export interface CreateReservationData {
  facilityId: string;
  residentId: string;
  date: string;
  durationInHours: number;
}

export interface UpdateReservationData {
  facilityId?: string;
  residentId?: string;
  date?: string;
  durationInHours?: number;
}

export type BillType =
  | "MAINTENANCE"
  | "UTILITY"
  | "FACILITY"
  | "PENALTY"
  | "OTHER";

export interface Bill {
  _id: string;
  user: UserSummary;
  title: string;
  description?: string;
  dueDate: string;
  amount: number;
  isCleared: boolean;
  clearedAt: string | null;
  billType: BillType;
  month: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillData {
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  amount: number;
  billType: BillType;
  month: string;
}

export interface CreateBulkBillData {
  title: string;
  description?: string;
  dueDate: string;
  amount: number;
  billType: BillType;
  month: string;
}

export interface UpdateBillData {
  title?: string;
  description?: string;
  dueDate?: string;
  amount?: number;
  isCleared?: boolean;
  billType?: BillType;
}

export interface BillingStats {
  totalBills: number;
  pendingBills: number;
  clearedBills: number;
  totalAmount: number;
  pendingAmount: number;
}

export const BILL_TYPES = [
  "MAINTENANCE",
  "UTILITY",
  "FACILITY",
  "PENALTY",
  "OTHER",
] as const;

export interface Announcement {
  _id: string;
  title: string;
  description: string;
  isUrgent: boolean;
  kind: "ANNOUNCEMENT" | "POLL";
  isPinned: boolean;
  commentsEnabled: boolean;
  expiresAt?: string | null;
  pollOptions: {
    _id: string;
    text: string;
    voters: string[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  description: string;
  isUrgent: boolean;
  kind?: "ANNOUNCEMENT" | "POLL";
  commentsEnabled?: boolean;
  expiresAt?: string | null;
  pollOptions?: { text: string }[];
}

export interface UpdateAnnouncementData {
  title?: string;
  description?: string;
  isUrgent?: boolean;
  commentsEnabled?: boolean;
  expiresAt?: string | null;
}

// --- VISITORS TYPES ---

export type VisitorType = "GUEST" | "SERVICE" | "DELIVERY" | "RIDE";
export type VisitorStatus =
  | "ACTIVE"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "EXPIRED"
  | "DENIED";

export interface Visitor {
  _id: string;
  host: string; // ObjectId string of the User/Resident
  name: string;
  phoneNumber: string;
  visitDate: string; // ISO Date string
  type: VisitorType;
  status: VisitorStatus;
  photoUrl?: string;
  entryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitorData {
  name: string;
  phoneNumber: string;
  visitDate: string;
  type: VisitorType;
  status?: VisitorStatus;
  photoUrl?: string;
  host?: string; // Ideally required by schema, but might be inferred by backend context
}

export interface UpdateVisitorData {
  name?: string;
  phoneNumber?: string;
  visitDate?: string;
  type?: VisitorType;
  status?: VisitorStatus;
  photoUrl?: string;
  entryCode?: string;
}

// --- REPORTS TYPES ---
export type ReportType =
  | "SOCIAL_POST"
  | "MARKET_PRODUCT"
  | "PERSON"
  | "OTHER"
  | "INCIDENT"
  | "DANGEROUS_AREA";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface Report {
  _id: string;
  reporter: UserSummary; // We populated this in backend
  type: ReportType;
  reason: string;
  status: ReportStatus;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReportData {
  status?: ReportStatus;
  adminResponse?: string;
}

// --- SOCIAL & MARKETPLACE TYPES ---

export interface Post {
  _id: string;
  author: UserSummary;
  description: string;
  images: string[];
  totalLikes: number;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = "AVAILABLE" | "SOLD" | "RESERVED" | "DELETED";

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerId: UserSummary; // Backend populates this
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProductStatusData {
  status: ProductStatus;
}

// --- MODERATION TYPES ---

export type ModerationStatus =
  | "OPEN"
  | "RESOLVED_BANNED"
  | "RESOLVED_DISMISSED";
export type ModerationTargetModel = "Post" | "Product";

export interface ModerationCase {
  _id: string;
  // targetId is populated with the actual object (Post or Product)
  // We use a union type here. You can use type guards in UI to differentiate.
  targetId: Post | Product;
  targetModel: ModerationTargetModel;
  reason: string; // e.g. "Hate Speech"
  flaggedContentSnippet?: string;
  aiConfidence?: string; // "High", "Medium", etc.
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveCaseData {
  action: "BAN" | "DISMISS";
}

// --- SOCIETY AREA TYPES ---

export interface SocietyArea {
  _id: string;
  name: string;
  mapId: "block_a" | "block_b" | "block_c" | "central_park";
  isSafe: boolean;
  cctvIndex: number;
  description?: string;
  updatedAt: string;
}

export interface UpdateAreaStatusData {
  isSafe: boolean;
}

// --- CHAT TYPES ---

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: string; // User ID
  text: string;
  createdAt: string;
}

export interface Conversation {
  conversationId: string;
  otherUser: UserSummary; // The person the admin is talking to
  lastMessage?: {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
    isRead: boolean;
  };
}

// --- SERVICE TYPES ---

export type ServiceStatus = "AVAILABLE" | "UNAVAILABLE" | "DELETED";
export type ServiceTypeEnum = "ONE_TIME" | "RECURRING";

export interface Service {
  _id: string;
  title: string; // Standardized: Use 'title' for both Products and Services
  description: string;
  price: number;
  category: string;
  images: string[];
  provider: UserSummary; // Populated User object
  status: ServiceStatus;
  serviceType: ServiceTypeEnum;
  duration: string; // e.g. "30 mins", "1 hour"
  createdAt: string;
  updatedAt: string;
}

// --- ADS TYPES ---
export type AdStatus = "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED";
export type AdTargetModel = "Product" | "Service";

export interface Ad {
  _id: string;
  advertiser: UserSummary;
  targetItem: Product | Service; // Union type
  targetModel: AdTargetModel;
  status: AdStatus;
  durationDays: number;
  clicks: number;
  expiresAt?: string;
  createdAt: string;
}

export interface UpdateAdStatusData {
  status: AdStatus;
  adminNote?: string;
}
