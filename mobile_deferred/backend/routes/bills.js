import express from "express";
import {
  getBill,
  getAllBills,
  getUserBills,
  getBillById,
  createBill,
  createBulkBills,
  updateBill,
  deleteBill,
  getBillingStats,
} from "../controllers/billController.js";
import { isUserAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// User routes
router.get("/user", isUserAuthenticated, getUserBills);
router.get("/:id", isUserAuthenticated, getBill, getBillById);
router.patch("/:id", isUserAuthenticated, getBill, updateBill);

// Admin routes
router.get("/", isUserAuthenticated, authorizeRoles("ADMIN"), getAllBills);
router.post("/", isUserAuthenticated, authorizeRoles("ADMIN"), createBill);
router.post(
  "/bulk",
  isUserAuthenticated,
  authorizeRoles("ADMIN"),
  createBulkBills
);
router.delete(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN"),
  getBill,
  deleteBill
);
router.get(
  "/admin/stats",
  isUserAuthenticated,
  authorizeRoles("ADMIN"),
  getBillingStats
);

export default router;
