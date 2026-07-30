import Notification from "../models/notification.js";
import User from "../models/user.js";
import { io, userSocketMap } from "../server.js";

const preferenceKeyByType = {
  MESSAGE: "messages",
  ANNOUNCEMENT: "announcements",
  EMERGENCY: "emergencies",
  MAINTENANCE: "maintenance",
  BILLING: "billing",
};

export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  link = null,
  metadata = {},
}) => {
  const user = await User.findById(recipient).select("notificationPreferences");
  if (!user) return null;

  const preferenceKey = preferenceKeyByType[type];
  if (
    preferenceKey &&
    user.notificationPreferences?.[preferenceKey] === false &&
    type !== "EMERGENCY"
  ) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
  });

  const socketId = userSocketMap.get(String(recipient));
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }

  return notification;
};

export const notifyRoles = async (roles, payload) => {
  const users = await User.find({
    role: { $in: roles },
    accountStatus: { $nin: ["SUSPENDED", "DEACTIVATED"] },
  }).select("_id");

  return Promise.allSettled(
    users.map((user) =>
      createNotification({ recipient: user._id, ...payload })
    )
  );
};
