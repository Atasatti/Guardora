import User from "../models/user.js";
import sendMail from "../utils/sendMail.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import sendToken from "../utils/jwtToken.js";
import {
  removeUploadFile,
  storedUploadPath,
} from "../config/uploads.js";
import { MODERATOR_PERMISSIONS } from "../models/user.js";
import { recordAudit } from "../utils/audit.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const hashActivationCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

// Get current user profile
const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

const getSocketToken = catchAsyncErrors(async (req, res, next) => {
  if (!process.env.JWT_SECRET_KEY) {
    return next(new ErrorHandler("Authentication is not configured", 503));
  }
  const token = jwt.sign(
    { id: req.user._id, scope: "socket" },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "5m" }
  );
  res.json({ success: true, token, expiresInSeconds: 300 });
});

// Create user (registration with email activation)
const createUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, phoneNumber, unitNumber } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!name || !normalizedEmail || !password || !phoneNumber || !unitNumber) {
    if (req.file) removeUploadFile(req.file.filename);
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const userEmail = await User.findOne({ email: normalizedEmail }).select(
    "+activationCodeHash +activationExpiresAt"
  );

  if (userEmail) {
    if (req.file) {
      removeUploadFile(req.file.filename);
    }
    return next(
      new ErrorHandler(
        userEmail.isVerified
          ? "User already exists"
          : "Account is awaiting activation. Request a new code.",
        400
      )
    );
  }

  const profilePicture = req.file
    ? storedUploadPath(req.file.filename)
    : null;

  const activationCode = crypto.randomInt(100000, 1000000).toString();
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phoneNumber,
    unitNumber,
    profilePicture,
    isVerified: false,
    activationCodeHash: hashActivationCode(activationCode),
    activationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendMail({
    email: normalizedEmail,
    subject: "Activate your account",
    text: `Hello ${user.name},\n\nYour activation code is: ${activationCode}\n\nThis code will expire in 10 minutes.\n\nPlease enter this code in the app to activate your account.`,
  });

  res.status(201).json({
    success: true,
    message: `Please check your email: ${normalizedEmail} for the activation code.`,
  });
});

// Resend activation code
const resendActivationCode = catchAsyncErrors(async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email) {
    return next(new ErrorHandler("Please provide email", 400));
  }

  const user = await User.findOne({ email }).select(
    "+activationCodeHash +activationExpiresAt"
  );
  if (!user) {
    return next(
      new ErrorHandler("No pending activation found for this email", 400)
    );
  }
  if (user.isVerified) {
    return next(new ErrorHandler("User is already activated", 400));
  }

  const activationCode = crypto.randomInt(100000, 1000000).toString();
  user.activationCodeHash = hashActivationCode(activationCode);
  user.activationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendMail({
    email: email,
    subject: "New Activation Code",
    text: `Hello ${user.name},\n\nYour new activation code is: ${activationCode}\n\nThis code will expire in 10 minutes.\n\nPlease enter this code in the app to activate your account.`,
  });

  res.status(200).json({
    success: true,
    message: `New activation code sent to ${email}`,
  });
});

// Activate user account
const activateUser = catchAsyncErrors(async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { activationCode } = req.body;

  if (!email || !activationCode) {
    return next(
      new ErrorHandler("Please provide email and activation code", 400)
    );
  }

  const user = await User.findOne({ email }).select(
    "+activationCodeHash +activationExpiresAt"
  );
  if (!user || user.isVerified || !user.activationCodeHash) {
    return next(new ErrorHandler("Activation code expired or invalid", 400));
  }

  if (
    !user.activationExpiresAt ||
    Date.now() > user.activationExpiresAt.getTime()
  ) {
    return next(new ErrorHandler("Activation code has expired", 400));
  }

  const providedHash = hashActivationCode(activationCode);
  const storedHash = user.activationCodeHash;
  const matches =
    providedHash.length === storedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(providedHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  if (!matches) {
    return next(new ErrorHandler("Invalid activation code", 400));
  }

  user.isVerified = true;
  user.activationCodeHash = null;
  user.activationExpiresAt = null;
  await user.save();

  // Remove password from response
  user.password = undefined;

  sendToken(user, 201, res);
});

// Lockout is a second line of defence behind the per-IP rate limit on this
// route. Because it keys on the account rather than the caller, a low
// threshold lets anyone who knows an address lock its owner out at will, so it
// is set high enough that only sustained guessing reaches it.
const LOGIN_MAX_ATTEMPTS = Math.max(
  Number.parseInt(process.env.LOGIN_MAX_ATTEMPTS || "10", 10) || 10,
  3
);
const LOGIN_LOCK_MS =
  Math.max(
    Number.parseInt(process.env.LOGIN_LOCK_MINUTES || "15", 10) || 15,
    1
  ) *
  60 *
  1000;

// Login user
const loginUser = catchAsyncErrors(async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select(
    "+password +failedLoginAttempts +lockUntil"
  );
  if (!user) {
    await recordAudit({
      req,
      action: "LOGIN_FAILED",
      targetModel: "Authentication",
      details: { email, reason: "UNKNOWN_ACCOUNT" },
    });
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  if (user.accountStatus && user.accountStatus !== "ACTIVE") {
    return next(
      new ErrorHandler(
        `Account is ${user.accountStatus.toLowerCase()}. Contact an administrator.`,
        403
      )
    );
  }
  if (!user.isVerified) {
    return next(
      new ErrorHandler("Activate your account before signing in", 403)
    );
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    await recordAudit({
      req: { user, headers: req.headers, socket: req.socket },
      action: "LOGIN_BLOCKED",
      targetModel: "User",
      targetId: user._id,
      details: { lockUntil: user.lockUntil },
    });
    return next(
      new ErrorHandler(
        `Account is temporarily locked. Try again after ${user.lockUntil.toISOString()}.`,
        423
      )
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= LOGIN_MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    await recordAudit({
      req: { user, headers: req.headers, socket: req.socket },
      action: "LOGIN_FAILED",
      targetModel: "User",
      targetId: user._id,
      details: {
        reason: "INVALID_PASSWORD",
        locked: Boolean(user.lockUntil),
      },
    });
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
  await recordAudit({
    req: { user, headers: req.headers, socket: req.socket },
    action: "LOGIN_SUCCEEDED",
    targetModel: "User",
    targetId: user._id,
  });

  user.password = undefined;
  user.failedLoginAttempts = undefined;
  user.lockUntil = undefined;
  sendToken(user, 200, res);
});

// Logout user
const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get logged in user details
const getUserInfo = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Update user info
const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phoneNumber, unitNumber } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (unitNumber) user.unitNumber = unitNumber;

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// Update profile picture
const updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler("Profile picture is required", 400));
  }
  const existUser = await User.findById(req.user.id);

  if (existUser.profilePicture) {
    removeUploadFile(existUser.profilePicture);
  }

  const fileUrl = storedUploadPath(req.file.filename);
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: fileUrl },
    { new: true }
  );

  res.status(200).json({
    success: true,
    user,
  });
});

// Update emergency contact
const updateEmergencyContact = catchAsyncErrors(async (req, res, next) => {
  const { name, phoneNumber, relationship } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.emergencyContact = {
    name,
    phoneNumber,
    relationship,
  };

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// Change password
const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please provide old and new password", 400));
  }

  const user = await User.findById(req.user.id).select("+password");
  const isOldPasswordValid = await user.comparePassword(oldPassword);

  if (!isOldPasswordValid) {
    return next(new ErrorHandler("Incorrect old password", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Get a limited resident profile
const getUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    "name email phoneNumber unitNumber profilePicture role socialStats sellerStats dateOfBirth createdAt"
  );
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Get users
const getUsers = catchAsyncErrors(async (req, res) => {
  const { query } = req.query;
  const filter = {
    accountStatus: "ACTIVE",
    _id: { $nin: req.user.blockedUsers || [] },
    "privacySettings.discoverable": { $ne: false },
  };

  if (query) {
    User.find({
      ...filter,
      name: {
        $regex: query,
        $options: "i",
      },
    })
      .select("name profilePicture unitNumber")
      .then((users) => res.json(users))
      .catch((error) => {
        res.status(500).json({ error: "Failed to search users" });
      });
  } else {
    User.find(filter)
      .select("name profilePicture unitNumber")
      .then((users) => res.json(users))
      .catch((error) => {
        res.status(500).json({ error: "Failed to fetch users" });
      });
  }
});

const toggleFollowUser = catchAsyncErrors(async (req, res) => {
  const { userId } = req.params; // User to follow/unfollow
  const currentUserId = req.user.id; // Current authenticated user

  // Prevent users from following themselves
  if (userId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: "You cannot follow yourself",
    });
  }

  try {
    // Find both users
    const [userToFollow, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(currentUserId),
    ]);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const eitherBlocked =
      currentUser.blockedUsers.includes(userId) ||
      userToFollow.blockedUsers.includes(currentUserId);
    if (eitherBlocked) {
      return res.status(403).json({
        success: false,
        message: "This interaction is blocked",
      });
    }

    const isCurrentlyFollowing =
      currentUser.socialStats.following.includes(userId);
    let message = "";

    if (isCurrentlyFollowing) {
      // Unfollow logic
      currentUser.socialStats.following.pull(userId);
      currentUser.socialStats.totalFollowing -= 1;

      userToFollow.socialStats.followers.pull(currentUserId);
      userToFollow.socialStats.totalFollowers -= 1;

      message = "Unfollowed successfully";
    } else {
      // Follow logic
      currentUser.socialStats.following.push(userId);
      currentUser.socialStats.totalFollowing += 1;

      userToFollow.socialStats.followers.push(currentUserId);
      userToFollow.socialStats.totalFollowers += 1;

      message = "Followed successfully";
    }

    // Save both users
    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.status(200).json({
      success: true,
      message,
      isFollowing: !isCurrentlyFollowing,
      followersCount: userToFollow.socialStats.totalFollowers,
      followingCount: currentUser.socialStats.totalFollowing,
    });
  } catch (error) {
    console.error("Follow/Unfollow error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to follow/unfollow user",
    });
  }
});

// ADMIN FUNCTIONS

const adminGetAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
});

const adminCreateUser = catchAsyncErrors(async (req, res, next) => {
  const { name, password, phoneNumber, unitNumber, role } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  // Check if user already exists
  const userEmail = await User.findOne({ email });
  if (userEmail) {
    // If a file was uploaded, delete it
    if (req.file) {
      removeUploadFile(req.file.filename);
    }
    return next(new ErrorHandler("User already exists", 400));
  }

  // Check for required fields
  if (!name || !email || !password || !phoneNumber || !unitNumber || !role) {
    if (req.file) {
      removeUploadFile(req.file.filename);
    }
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check for valid role
  if (!["RESIDENT", "ADMIN", "MODERATOR"].includes(role)) {
    if (req.file) {
      removeUploadFile(req.file.filename);
    }
    return next(new ErrorHandler(`Role "${role}" is not valid`, 400));
  }

  const profilePicture = req.file
    ? storedUploadPath(req.file.filename)
    : null;

  // Create user (password will be hashed by the 'pre-save' hook)
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    unitNumber,
    role,
    profilePicture,
    isVerified: true,
  });

  await recordAudit({
    req,
    action: "USER_CREATED",
    targetModel: "User",
    targetId: user._id,
    details: { role: user.role, unitNumber: user.unitNumber },
  });

  // Don't send token, admin is just creating a user, not logging them in
  res.status(201).json({
    success: true,
    user,
  });
});

const adminUpdateUser = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    phoneNumber,
    unitNumber,
    role,
    permissions,
    accountStatus,
  } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  const accessFieldsRequested =
    role !== undefined ||
    permissions !== undefined ||
    accountStatus !== undefined;
  if (accessFieldsRequested && req.user.role !== "ADMIN") {
    return next(
      new ErrorHandler("Only administrators can change roles or access", 403)
    );
  }

  user.email = email ? String(email).trim().toLowerCase() : user.email;
  user.name = name || user.name;
  user.phoneNumber = phoneNumber || user.phoneNumber;
  user.unitNumber = unitNumber || user.unitNumber;

  if (role !== undefined) {
    if (!["RESIDENT", "ADMIN", "MODERATOR"].includes(role)) {
      return next(new ErrorHandler("Invalid role", 400));
    }
    user.role = role;
  }

  if (permissions !== undefined) {
    if (!Array.isArray(permissions)) {
      return next(new ErrorHandler("Permissions must be an array", 400));
    }
    const invalidPermissions = permissions.filter(
      (permission) => !MODERATOR_PERMISSIONS.includes(permission)
    );
    if (invalidPermissions.length) {
      return next(
        new ErrorHandler(
          `Invalid permissions: ${invalidPermissions.join(", ")}`,
          400
        )
      );
    }
    user.permissions = user.role === "MODERATOR" ? permissions : [];
  } else if (role !== undefined && user.role !== "MODERATOR") {
    user.permissions = [];
  }

  if (accountStatus !== undefined) {
    if (!["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(accountStatus)) {
      return next(new ErrorHandler("Invalid account status", 400));
    }
    if (
      String(user._id) === String(req.user._id) &&
      accountStatus !== "ACTIVE"
    ) {
      return next(new ErrorHandler("You cannot disable your own account", 400));
    }
    user.accountStatus = accountStatus;
  }

  await user.save();

  await recordAudit({
    req,
    action: accessFieldsRequested ? "USER_ACCESS_UPDATED" : "USER_UPDATED",
    targetModel: "User",
    targetId: user._id,
    details: {
      role: user.role,
      permissions: user.permissions,
      accountStatus: user.accountStatus,
    },
  });

  res.status(200).json({
    success: true,
    user,
  });
});

const adminDeleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    );
  }

  if (String(user._id) === String(req.user._id)) {
    return next(new ErrorHandler("You cannot deactivate your own account", 400));
  }

  user.accountStatus = "DEACTIVATED";
  await user.save();

  await recordAudit({
    req,
    action: "USER_DEACTIVATED",
    targetModel: "User",
    targetId: user._id,
  });

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
});

const toggleBlockUser = catchAsyncErrors(async (req, res, next) => {
  const targetId = req.params.userId;
  if (String(targetId) === String(req.user._id)) {
    return next(new ErrorHandler("You cannot block yourself", 400));
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(req.user._id),
    User.findById(targetId),
  ]);
  if (!currentUser || !targetUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isBlocked = currentUser.blockedUsers.includes(targetId);
  if (isBlocked) {
    currentUser.blockedUsers.pull(targetId);
  } else {
    currentUser.blockedUsers.addToSet(targetId);
    currentUser.socialStats.following.pull(targetId);
    targetUser.socialStats.followers.pull(currentUser._id);
    targetUser.socialStats.following.pull(currentUser._id);
    currentUser.socialStats.followers.pull(targetId);
    currentUser.socialStats.totalFollowing =
      currentUser.socialStats.following.length;
    currentUser.socialStats.totalFollowers =
      currentUser.socialStats.followers.length;
    targetUser.socialStats.totalFollowing =
      targetUser.socialStats.following.length;
    targetUser.socialStats.totalFollowers =
      targetUser.socialStats.followers.length;
  }

  await Promise.all([currentUser.save(), targetUser.save()]);
  res.status(200).json({
    success: true,
    blocked: !isBlocked,
    message: isBlocked ? "User unblocked" : "User blocked",
  });
});

const updateNotificationPreferences = catchAsyncErrors(
  async (req, res, next) => {
    const allowed = [
      "messages",
      "announcements",
      "emergencies",
      "maintenance",
      "billing",
    ];
    const updates = {};
    for (const key of allowed) {
      if (typeof req.body[key] === "boolean") {
        updates[`notificationPreferences.${key}`] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
      success: true,
      notificationPreferences: user.notificationPreferences,
    });
  }
);

const updatePrivacySettings = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  for (const field of [
    "profileVisibility",
    "messagePermission",
    "discoverable",
    "showEmail",
    "showPhone",
  ]) {
    if (req.body[field] !== undefined) {
      user.privacySettings[field] = req.body[field];
    }
  }
  await user.save();
  res.json({ success: true, privacySettings: user.privacySettings });
});

const listHouseholdProfiles = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    "householdProfiles activeHouseholdProfile"
  );
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.json({
    profiles: user.householdProfiles,
    activeHouseholdProfile: user.activeHouseholdProfile,
  });
});

const createHouseholdProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  if (user.householdProfiles.length >= 10) {
    return next(new ErrorHandler("A household can have up to 10 profiles", 409));
  }
  const name = String(req.body.name || "").trim();
  if (!name) return next(new ErrorHandler("Profile name is required", 400));
  const profile = {
    name,
    relationship: req.body.relationship || "OTHER",
    dateOfBirth: req.body.dateOfBirth || null,
    avatar: req.body.avatar || null,
    isPrimary: user.householdProfiles.length === 0,
  };
  user.householdProfiles.push(profile);
  if (!user.activeHouseholdProfile) {
    user.activeHouseholdProfile = user.householdProfiles.at(-1)._id;
  }
  await user.save();
  res.status(201).json(user.householdProfiles.at(-1));
});

const updateHouseholdProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const profile = user?.householdProfiles.id(req.params.profileId);
  if (!profile) return next(new ErrorHandler("Household profile not found", 404));
  for (const field of ["name", "relationship", "dateOfBirth", "avatar"]) {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  }
  await user.save();
  res.json(profile);
});

const selectHouseholdProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const profile = user?.householdProfiles.id(req.params.profileId);
  if (!profile) return next(new ErrorHandler("Household profile not found", 404));
  user.activeHouseholdProfile = profile._id;
  await user.save();
  res.json({ activeProfile: profile });
});

const deleteHouseholdProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const profile = user?.householdProfiles.id(req.params.profileId);
  if (!profile) return next(new ErrorHandler("Household profile not found", 404));
  if (profile.isPrimary) {
    return next(new ErrorHandler("The primary household profile cannot be deleted", 409));
  }
  const wasActive =
    String(user.activeHouseholdProfile) === String(profile._id);
  profile.deleteOne();
  if (wasActive) {
    user.activeHouseholdProfile =
      user.householdProfiles.find((item) => item.isPrimary)?._id || null;
  }
  await user.save();
  res.json({ message: "Household profile deleted" });
});

export {
  adminGetAllUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getProfile,
  getSocketToken,
  createUser,
  activateUser,
  resendActivationCode,
  loginUser,
  logoutUser,
  getUserInfo,
  updateUserInfo,
  updateProfilePicture,
  updateEmergencyContact,
  changePassword,
  getUserById,
  getUsers,
  toggleFollowUser,
  toggleBlockUser,
  updateNotificationPreferences,
  updatePrivacySettings,
  listHouseholdProfiles,
  createHouseholdProfile,
  updateHouseholdProfile,
  selectHouseholdProfile,
  deleteHouseholdProfile,
};
