import AuditLog from "../models/auditLog.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";

export const getAuditLogs = catchAsyncErrors(async (req, res) => {
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit || "100", 10), 1),
    250
  );
  const filter = {};
  if (req.query.targetModel) filter.targetModel = req.query.targetModel;
  if (req.query.action) filter.action = req.query.action;

  const logs = await AuditLog.find(filter)
    .populate("actor", "name email role profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({ success: true, logs });
});

export const getSuspiciousActivity = catchAsyncErrors(async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await AuditLog.find({
    action: { $in: ["LOGIN_FAILED", "LOGIN_BLOCKED"] },
    createdAt: { $gte: since },
  })
    .populate("actor", "name email unitNumber role")
    .sort({ createdAt: -1 })
    .limit(500);

  const groups = new Map();
  for (const event of events) {
    const key = event.targetId || event.ipAddress || String(event._id);
    const current = groups.get(key) || {
      key,
      actor: event.actor || null,
      actorName:
        event.actor?.name || event.details?.email || event.actorName || "Unknown",
      ipAddress: event.ipAddress,
      failedAttempts: 0,
      blockedAttempts: 0,
      latestAt: event.createdAt,
    };
    current.failedAttempts += event.action === "LOGIN_FAILED" ? 1 : 0;
    current.blockedAttempts += event.action === "LOGIN_BLOCKED" ? 1 : 0;
    if (event.createdAt > current.latestAt) current.latestAt = event.createdAt;
    groups.set(key, current);
  }

  const activity = [...groups.values()]
    .map((entry) => {
      const score = Math.min(
        entry.failedAttempts * 20 + entry.blockedAttempts * 50,
        100
      );
      return {
        ...entry,
        score,
        severity: score >= 75 ? "CRITICAL" : score >= 40 ? "HIGH" : "MEDIUM",
      };
    })
    .sort((left, right) => right.score - left.score);

  res.json({
    success: true,
    windowHours: 24,
    threshold: "3+ failures or any locked-account attempt",
    activity: activity.filter(
      (entry) => entry.failedAttempts >= 3 || entry.blockedAttempts > 0
    ),
    recentEvents: events.slice(0, 25),
  });
});
