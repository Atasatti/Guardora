import Stripe from "stripe";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { confirmOrderPayment } from "../services/orderService.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// ✅ Step 1: Create Checkout Session
export const createCheckoutSession = catchAsyncErrors(async (req, res) => {
  const { orderId, amount, currency } = req.body;
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;

  if (!successUrl || !cancelUrl) {
    throw new Error(
      "STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL must be configured"
    );
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: "Order #" + orderId },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderId }, // 👈 crucial for webhook
  });

  res.json({ url: session.url });
});

// ✅ Step 2: Webhook to confirm payment
export const handleWebhook = catchAsyncErrors(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await confirmOrderPayment(orderId);
  }

  res.json({ received: true });
});
