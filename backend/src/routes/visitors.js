import express from "express";
import {
  getVisitor,
  getAllVisitors,
  getResidentVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  verifyVisitorPass,
  checkInVisitor,
  checkOutVisitor,
  flagVisitor,
} from "../controllers/visitorController.js";

import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_VISITORS"),
  getAllVisitors
);
router.get("/resident", isUserAuthenticated, getResidentVisitors);
router.get(
  "/verify/:entryCode",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_VISITORS"),
  verifyVisitorPass
);
router.post(
  "/:id/check-in",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_VISITORS"),
  getVisitor,
  checkInVisitor
);
router.post(
  "/:id/check-out",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_VISITORS"),
  getVisitor,
  checkOutVisitor
);
router.post("/:id/flag", isUserAuthenticated, getVisitor, flagVisitor);
router.get("/:id", isUserAuthenticated, getVisitor, getVisitorById);
router.post("/", isUserAuthenticated, createVisitor);
router.put("/:id", isUserAuthenticated, getVisitor, updateVisitor);
router.delete("/:id", isUserAuthenticated, getVisitor, deleteVisitor);

export default router;
