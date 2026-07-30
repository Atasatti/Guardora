import express from "express";
import {
  getBill,
  getAllBills,
  getUserBills,
  exportBillsCsv,
  getBillById,
  createBill,
  createBulkBills,
  updateBill,
  submitPayment,
  capturePayPalPayment,
  confirmPayment,
  getReceipt,
  downloadReceiptPdf,
  downloadMonthlyStatementPdf,
  applyLateFees,
  deleteBill,
  getBillingStats,
} from "../controllers/billController.js";
import {
  isUserAuthenticated,
  authorizePermissions,
  authorizeRoles,
} from "../middlewares/auth.js";

const router = express.Router();
const billingManagers = [
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_BILLING"),
];

router.get("/user", isUserAuthenticated, getUserBills);
router.get(
  "/user/statement.pdf",
  isUserAuthenticated,
  downloadMonthlyStatementPdf
);
router.get(
  "/admin/stats",
  isUserAuthenticated,
  ...billingManagers,
  getBillingStats
);
router.post(
  "/admin/late-fees",
  isUserAuthenticated,
  ...billingManagers,
  applyLateFees
);
router.patch(
  "/payments/:paymentId/confirm",
  isUserAuthenticated,
  ...billingManagers,
  confirmPayment
);
router.post(
  "/payments/:paymentId/paypal/capture",
  isUserAuthenticated,
  capturePayPalPayment
);
router.get("/", isUserAuthenticated, ...billingManagers, getAllBills);
router.get(
  "/admin/export.csv",
  isUserAuthenticated,
  ...billingManagers,
  exportBillsCsv
);
router.post("/", isUserAuthenticated, ...billingManagers, createBill);
router.post(
  "/bulk",
  isUserAuthenticated,
  ...billingManagers,
  createBulkBills
);
router.get("/:id/receipt", isUserAuthenticated, getBill, getReceipt);
router.get(
  "/:id/receipt.pdf",
  isUserAuthenticated,
  getBill,
  downloadReceiptPdf
);
router.post("/:id/payments", isUserAuthenticated, getBill, submitPayment);
router.get("/:id", isUserAuthenticated, getBill, getBillById);
router.patch(
  "/:id",
  isUserAuthenticated,
  ...billingManagers,
  getBill,
  updateBill
);
router.delete(
  "/:id",
  isUserAuthenticated,
  ...billingManagers,
  getBill,
  deleteBill
);

export default router;
