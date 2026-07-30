import AuditLog from "../models/auditLog.js";

export const recordAudit = async ({
  req,
  action,
  targetModel,
  targetId = null,
  details = {},
}) => {
  try {
    await AuditLog.create({
      actor: req?.user?._id || null,
      actorName: req?.user?.name || "System",
      action,
      targetModel,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.socket?.remoteAddress ||
        null,
    });
  } catch (error) {
    console.error("Audit logging failed:", error.message);
  }
};
