import http from "http";
import { Server } from "socket.io";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import ErrorHandler from "./middlewares/error.js";
import { uploadsDirectory } from "./config/uploads.js";
import User from "./models/user.js";
import { processReservationLifecycle } from "./services/reservationLifecycle.js";
import {
  securityHeaders,
  verifyBrowserOrigin,
} from "./middlewares/security.js";

// Routes Imports
import usersRouter from "./routes/users.js";
import announcementsRouter from "./routes/announcements.js";
import facilitiesRouter from "./routes/facilities.js";
import reservationsRouter from "./routes/reservations.js";
import maintenanceTicketsRouter from "./routes/maintenanceTickets.js";
import billsRouter from "./routes/bills.js";
import visitorsRouter from "./routes/visitors.js";
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";
import reportRouter from "./routes/reports.js";
import moderationRouter from "./routes/moderationCases.js";
import areaRouter from "./routes/areas.js";
import emergencyRouter from "./routes/emergencies.js";
import chatRouter from "./routes/chat.js";
import adsRouter from "./routes/ads.js";
import alertsRouter from "./routes/alerts.js";
import bannedRouter from "./routes/bannedPersons.js";
import aiLabRouter from "./routes/aiLab.js";
import notificationsRouter from "./routes/notifications.js";
import auditLogsRouter from "./routes/auditLogs.js";
import offersRouter from "./routes/offers.js";
import commentsRouter from "./routes/comments.js";
import friendRequestsRouter from "./routes/friendRequests.js";
import camerasRouter from "./routes/cameras.js";
import { handleStripeWebhook } from "./controllers/billController.js";

dotenv.config();

const databaseReady = connectDB().catch(() => {
  process.exitCode = 1;
  throw new Error("Database connection failed");
});

const app = express();
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = corsOrigins.includes("*")
  ? "*"
  : corsOrigins.length > 0
    ? corsOrigins
    : false;
const corsCredentials = corsOrigin !== "*";

// --- Create HTTP Server & Initialize Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: corsCredentials,
  },
});

// ---  Socket.io Logic ---
const userSocketMap = new Map(); // Maps userId -> socketId

const canUseDirectSocket = async (senderId, receiverId) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_BYPASS === "true"
  ) {
    return true;
  }
  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select("blockedUsers"),
    User.findById(receiverId).select(
      "blockedUsers friends accountStatus privacySettings.messagePermission"
    ),
  ]);
  if (
    !sender ||
    !receiver ||
    (receiver.accountStatus && receiver.accountStatus !== "ACTIVE") ||
    sender.blockedUsers?.some((id) => String(id) === String(receiverId)) ||
    receiver.blockedUsers?.some((id) => String(id) === String(senderId)) ||
    receiver.privacySettings?.messagePermission === "NONE"
  ) {
    return false;
  }
  return !(
    receiver.privacySettings?.messagePermission === "FRIENDS" &&
    !receiver.friends?.some((id) => String(id) === String(senderId))
  );
};

const getCookieValue = (cookieHeader, key) =>
  String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === key)?.[1] || null;

io.use(async (socket, next) => {
  try {
    const bypassEnabled =
      process.env.NODE_ENV !== "production" &&
      process.env.AUTH_BYPASS === "true";
    if (bypassEnabled) {
      socket.data.userId = "000000000000000000000001";
      return next();
    }

    const token =
      socket.handshake.auth?.token ||
      getCookieValue(socket.handshake.headers.cookie, "token");
    if (!token || !process.env.JWT_SECRET_KEY) {
      return next(new Error("Authentication required"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("accountStatus");
    if (!user || (user.accountStatus && user.accountStatus !== "ACTIVE")) {
      return next(new Error("Account is unavailable"));
    }
    socket.data.userId = String(user._id);
    next();
  } catch {
    next(new Error("Invalid authentication"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", () => {
    const userId = socket.data.userId;
    userSocketMap.set(String(userId), socket.id);
    console.log(`User ${userId} is online (Socket: ${socket.id})`);
  });

  // 2. User sends a message
  socket.on("send_message", async (data) => {
    if (
      !(await canUseDirectSocket(socket.data.userId, String(data.receiverId)))
    ) {
      return;
    }
    const receiverSocketId = userSocketMap.get(String(data.receiverId));

    // If receiver is online, send it immediately
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", {
        ...data,
        senderId: socket.data.userId,
      });
    }
  });

  const relayCallEvent = async (eventName, data = {}) => {
    const receiverId = String(data.receiverId || "");
    if (!receiverId) return;
    if (!(await canUseDirectSocket(socket.data.userId, receiverId))) return;
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(eventName, {
        ...data,
        senderId: socket.data.userId,
        receiverId,
      });
    }
  };

  socket.on("call_offer", (data) => void relayCallEvent("call_offer", data));
  socket.on("call_answer", (data) => void relayCallEvent("call_answer", data));
  socket.on("ice_candidate", (data) =>
    void relayCallEvent("ice_candidate", data)
  );
  socket.on("call_end", (data) => void relayCallEvent("call_end", data));

  // 3. User disconnects
  socket.on("disconnect", () => {
    if (userSocketMap.get(String(socket.data.userId)) === socket.id) {
      userSocketMap.delete(String(socket.data.userId));
    }
    console.log("Socket disconnected:", socket.id);
  });
});

app.use("/uploads", express.static(uploadsDirectory));
app.use(securityHeaders);

app.use(
  cors({
    origin: corsOrigin,
    credentials: corsCredentials,
  })
);
app.use(verifyBrowserOrigin(corsOrigins));
app.post(
  "/api/bills/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());

// API Routes
app.use("/api/users", usersRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/maintenance_tickets", maintenanceTicketsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/visitors", visitorsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/products", productsRouter);
app.use("/api/reports", reportRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/areas", areaRouter);
app.use("/api/emergencies", emergencyRouter);
app.use("/api/chat", chatRouter);
app.use("/api/ads", adsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/banned-persons", bannedRouter);
app.use("/api/ai-lab", aiLabRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/offers", offersRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/friend-requests", friendRequestsRouter);
app.use("/api/cameras", camerasRouter);

app.use(ErrorHandler);

const port = Number.parseInt(process.env.PORT || "4000", 10);
const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});

let reservationLifecycleRunning = false;
const lifecycleInterval = Math.max(
  Number.parseInt(
    process.env.RESERVATION_LIFECYCLE_INTERVAL_MS || "900000",
    10
  ),
  60000
);
const runReservationLifecycle = async () => {
  if (reservationLifecycleRunning) return;
  reservationLifecycleRunning = true;
  try {
    const result = await processReservationLifecycle();
    if (result.processed || result.remindersSent) {
      console.log("Reservation lifecycle:", result);
    }
  } catch (error) {
    console.error("Reservation lifecycle failed:", error.message);
  } finally {
    reservationLifecycleRunning = false;
  }
};
databaseReady
  .then(() => runReservationLifecycle())
  .catch(() => {});
const lifecycleTimer = setInterval(runReservationLifecycle, lifecycleInterval);
lifecycleTimer.unref();

export { io, userSocketMap };
