import express from "express";
import upload from "../multer.js";
import {
  isUserAuthenticated,
  authorizePermissions,
  authorizeRoles,
} from "../middlewares/auth.js";
import {
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
  adminGetAllUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getProfile,
  getSocketToken,
  listHouseholdProfiles,
  createHouseholdProfile,
  updateHouseholdProfile,
  selectHouseholdProfile,
  deleteHouseholdProfile,
} from "../controllers/userController.js";
import { rateLimit } from "../middlewares/security.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

// Protected routes (require authentication)
router.post("/logout", isUserAuthenticated, logoutUser);
router.get("/me", isUserAuthenticated, getUserInfo);
router.get("/socket-token", isUserAuthenticated, getSocketToken);
router.put("/update-info", isUserAuthenticated, updateUserInfo);
router.put(
  "/update-profile-picture",
  isUserAuthenticated,
  upload.single("profilePicture"),
  updateProfilePicture
);
router.put(
  "/update-emergency-contact",
  isUserAuthenticated,
  updateEmergencyContact
);
router.put("/change-password", isUserAuthenticated, changePassword);
router.put(
  "/notification-preferences",
  isUserAuthenticated,
  updateNotificationPreferences
);
router.put("/privacy-settings", isUserAuthenticated, updatePrivacySettings);
router.post("/block/:userId", isUserAuthenticated, toggleBlockUser);
router.get(
  "/household-profiles",
  isUserAuthenticated,
  listHouseholdProfiles
);
router.post(
  "/household-profiles",
  isUserAuthenticated,
  createHouseholdProfile
);
router.put(
  "/household-profiles/:profileId",
  isUserAuthenticated,
  updateHouseholdProfile
);
router.patch(
  "/household-profiles/:profileId/select",
  isUserAuthenticated,
  selectHouseholdProfile
);
router.delete(
  "/household-profiles/:profileId",
  isUserAuthenticated,
  deleteHouseholdProfile
);

// Admin Routes
router.get(
  "/admin/all",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_USERS"),
  adminGetAllUsers
);

router.post(
  "/admin/create",
  isUserAuthenticated,
  authorizeRoles("ADMIN"),
  upload.single("file"), // Allow profile pic upload on creation
  adminCreateUser
);

router.put(
  "/admin/update/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_USERS"),
  adminUpdateUser
);

router.delete(
  "/admin/delete/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN"),
  adminDeleteUser
);

router.post("/me", isUserAuthenticated, getProfile);
router.post(
  "/register",
  registrationLimiter,
  upload.single("file"),
  createUser
);
router.post("/activation", authLimiter, activateUser);
router.post("/resend-activation", authLimiter, resendActivationCode);
router.post("/login", authLimiter, loginUser);
router.post("/follow/:userId", isUserAuthenticated, toggleFollowUser);
router.get("/:id", isUserAuthenticated, getUserById);
router.get("/", isUserAuthenticated, getUsers);

export default router;
