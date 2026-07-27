import express from "express";
import upload from "../multer.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";
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
  adminGetAllUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getProfile,
} from "../controllers/userController.js";

const router = express.Router();

// Protected routes (require authentication)
router.post("/logout", isUserAuthenticated, logoutUser);
router.get("/me", isUserAuthenticated, getUserInfo);
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

// Admin Routes
router.get(
  "/admin/all",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  adminGetAllUsers
);

router.post(
  "/admin/create",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  upload.single("file"), // Allow profile pic upload on creation
  adminCreateUser
);

router.put(
  "/admin/update/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  adminUpdateUser
);

router.delete(
  "/admin/delete/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  adminDeleteUser
);

// Public routes
router.post("/me", isUserAuthenticated, getProfile);
router.post("/register", upload.single("file"), createUser);
router.post("/activation", activateUser);
router.post("/resend-activation", resendActivationCode);
router.post("/login", loginUser);
router.post("/follow/:userId", isUserAuthenticated, toggleFollowUser);
router.get("/:id", getUserById);
router.get("/", getUsers);

export default router;
