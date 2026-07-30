import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import User, { MODERATOR_PERMISSIONS } from "../models/user.js";

const isUserAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const bypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_BYPASS === "true";

  if (bypassEnabled) {
    req.user = {
      _id: "000000000000000000000001",
      id: "000000000000000000000001",
      name: "Local Administrator",
      email: "local-admin@guardora.invalid",
      role: "ADMIN",
      permissions: MODERATOR_PERMISSIONS,
      accountStatus: "ACTIVE",
    };
    return next();
  }

  const authorization = req.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return next(new ErrorHandler("Please login to continue.", 401));
  }

  if (!process.env.JWT_SECRET_KEY) {
    return next(new ErrorHandler("Authentication is not configured", 503));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("Account no longer exists", 401));
  }

  if (req.user.accountStatus && req.user.accountStatus !== "ACTIVE") {
    return next(
      new ErrorHandler(
        `Account is ${req.user.accountStatus.toLowerCase()}. Contact an administrator.`,
        403
      )
    );
  }
  if (req.user.isVerified === false) {
    return next(new ErrorHandler("Account activation is required", 403));
  }

  next();
});

// Middleware to check if user has specific role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role || "UNKNOWN"} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

const authorizePermissions = (...permissions) => {
  return (req, res, next) => {
    if (req.user?.role === "ADMIN") {
      return next();
    }

    const granted = new Set(req.user?.permissions || []);
    const allowed = permissions.every((permission) => granted.has(permission));
    if (!allowed) {
      return next(
        new ErrorHandler(
          `Missing required permission: ${permissions.join(", ")}`,
          403
        )
      );
    }

    next();
  };
};

export { isUserAuthenticated, authorizeRoles, authorizePermissions };
