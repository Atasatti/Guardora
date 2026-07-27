import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);

// Stripe webhook endpoint (must be raw for verification)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
