import path from "path";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorHandler from "./middlewares/error.js";

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

dotenv.config();

connectDB().catch(() => {
  process.exitCode = 1;
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

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // 1. User joins the app (comes online)
  socket.on("join", (userId) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} is online (Socket: ${socket.id})`);
  });

  // 2. User sends a message
  socket.on("send_message", (data) => {
    // data = { senderId, receiverId, text, conversationId }
    const receiverSocketId = userSocketMap.get(data.receiverId);

    // If receiver is online, send it immediately
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", data);
    }
  });

  // 3. User disconnects
  socket.on("disconnect", () => {
    // Optional: Loop through map to remove userId if needed
    console.log("Socket disconnected:", socket.id);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(
  cors({
    origin: corsOrigin,
    credentials: corsCredentials,
  })
);
app.use(express.json());
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

app.use(ErrorHandler);

const port = Number.parseInt(process.env.PORT || "4000", 10);
const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});

export { io, userSocketMap };
