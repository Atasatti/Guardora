import crypto from "crypto";
import Stripe from "stripe";
import Bill from "../models/bill.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notifications.js";
import { sendCsv, sendPdf } from "../utils/downloads.js";

const canManageBilling = (user) =>
  user.role === "ADMIN" ||
  (user.role === "MODERATOR" &&
    user.permissions?.includes("MANAGE_BILLING"));

const makeReceiptNumber = () =>
  `GRD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

const completePayment = async (payment, bill, notify = true) => {
  if (payment.status === "SUCCEEDED" && bill.isCleared) {
    return { payment, bill };
  }
  const receiptNumber =
    payment.receiptNumber || bill.receiptNumber || makeReceiptNumber();
  const paidAt = payment.paidAt || new Date();
  payment.status = "SUCCEEDED";
  payment.paidAt = paidAt;
  payment.receiptNumber = receiptNumber;
  payment.failureReason = null;
  bill.isCleared = true;
  bill.paymentStatus = "PAID";
  bill.clearedAt = paidAt;
  bill.receiptNumber = receiptNumber;
  await Promise.all([payment.save(), bill.save()]);
  if (notify) {
    await createNotification({
      recipient: payment.user,
      type: "BILLING",
      title: "Payment confirmed",
      message: `Receipt ${receiptNumber} has been issued.`,
      link: "/finance",
      metadata: { billId: bill._id, paymentId: payment._id },
    });
  }
  return { payment, bill };
};

const paypalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal credentials are not configured");
  }
  const baseUrl =
    process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || "Unable to authenticate PayPal");
  }
  return { token: body.access_token, baseUrl };
};

const pagination = (query) => ({
  page: Math.max(Number.parseInt(query.page || "1", 10), 1),
  limit: Math.min(
    Math.max(Number.parseInt(query.limit || "10", 10), 1),
    100
  ),
});

const getAllBills = catchAsyncErrors(async (req, res) => {
  const { page, limit } = pagination(req.query);
  const filter = {};
  if (req.query.isCleared !== undefined) {
    filter.isCleared = req.query.isCleared === "true";
  }
  if (req.query.billType) filter.billType = req.query.billType;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .populate("user", "name email unitNumber profilePicture")
      .sort({ dueDate: 1 })
      .limit(limit)
      .skip((page - 1) * limit),
    Bill.countDocuments(filter),
  ]);
  res.status(200).json({
    bills,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

const getUserBills = catchAsyncErrors(async (req, res) => {
  const { page, limit } = pagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.isCleared !== undefined) {
    filter.isCleared = req.query.isCleared === "true";
  }
  if (req.query.billType) filter.billType = req.query.billType;

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .sort({ dueDate: 1 })
      .limit(limit)
      .skip((page - 1) * limit),
    Bill.countDocuments(filter),
  ]);
  res.status(200).json({
    bills,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

const exportBillsCsv = catchAsyncErrors(async (req, res) => {
  const bills = await Bill.find()
    .populate("user", "name email unitNumber")
    .sort({ dueDate: -1 });
  sendCsv(
    res,
    `guardora-billing-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { key: "resident", label: "Resident" },
      { key: "email", label: "Email" },
      { key: "unit", label: "Unit" },
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "month", label: "Month" },
      { key: "dueDate", label: "Due Date" },
      { key: "amount", label: "Amount (PKR)" },
      { key: "lateFee", label: "Late Fee (PKR)" },
      { key: "status", label: "Payment Status" },
      { key: "receipt", label: "Receipt Number" },
    ],
    bills.map((bill) => ({
      resident: bill.user?.name,
      email: bill.user?.email,
      unit: bill.user?.unitNumber,
      title: bill.title,
      type: bill.billType,
      month: bill.month,
      dueDate: bill.dueDate,
      amount: bill.amount,
      lateFee: bill.lateFee,
      status: bill.paymentStatus,
      receipt: bill.receiptNumber,
    }))
  );
});

const getBillById = catchAsyncErrors(async (req, res, next) => {
  const bill = res.bill;
  if (!canManageBilling(req.user) && String(bill.user) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  await bill.populate("user", "name email unitNumber profilePicture");
  res.json(bill);
});

const hasValidBillInput = ({ title, dueDate, amount, month }) => {
  const parsedDate = new Date(dueDate);
  const parsedAmount = Number(amount);
  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    !Number.isNaN(parsedDate.getTime()) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 0 &&
    /^\d{4}-\d{2}$/.test(month)
  );
};

const createBill = catchAsyncErrors(async (req, res, next) => {
  const { userId, title, description, dueDate, amount, billType, month } =
    req.body;
  if (!hasValidBillInput({ title, dueDate, amount, month })) {
    return next(new ErrorHandler("Valid bill details are required", 400));
  }

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));
  const bill = await Bill.create({
    user: userId,
    title: title.trim(),
    description,
    dueDate,
    amount: Number(amount),
    originalAmount: Number(amount),
    billType: billType || "OTHER",
    month,
  });

  await Promise.all([
    bill.populate("user", "name email unitNumber profilePicture"),
    createNotification({
      recipient: userId,
      type: "BILLING",
      title: "New bill issued",
      message: `${title}: PKR ${Number(amount).toLocaleString()}`,
      link: "/finance",
      metadata: { billId: bill._id },
    }),
    recordAudit({
      req,
      action: "BILL_CREATED",
      targetModel: "Bill",
      targetId: bill._id,
      details: { userId, amount: Number(amount), billType },
    }),
  ]);
  res.status(201).json(bill);
});

const createBulkBills = catchAsyncErrors(async (req, res, next) => {
  const { title, description, dueDate, amount, billType, month } = req.body;
  if (!hasValidBillInput({ title, dueDate, amount, month })) {
    return next(new ErrorHandler("Valid bill details are required", 400));
  }

  const residents = await User.find({
    role: "RESIDENT",
    accountStatus: { $ne: "DEACTIVATED" },
  }).select("_id");
  const bills = residents.map((resident) => ({
    user: resident._id,
    title: title.trim(),
    description,
    dueDate,
    amount: Number(amount),
    originalAmount: Number(amount),
    billType: billType || "OTHER",
    month,
  }));
  const createdBills = await Bill.insertMany(bills);
  await Promise.allSettled(
    residents.map((resident, index) =>
      createNotification({
        recipient: resident._id,
        type: "BILLING",
        title: "New bill issued",
        message: `${title}: PKR ${Number(amount).toLocaleString()}`,
        link: "/finance",
        metadata: { billId: createdBills[index]._id },
      })
    )
  );
  await recordAudit({
    req,
    action: "BULK_BILLS_CREATED",
    targetModel: "Bill",
    details: { count: createdBills.length, amount: Number(amount), billType },
  });
  res.status(201).json({
    message: `Created ${createdBills.length} bills successfully`,
    bills: createdBills,
  });
});

const updateBill = catchAsyncErrors(async (req, res, next) => {
  if (!canManageBilling(req.user)) {
    return next(
      new ErrorHandler(
        "Residents cannot mark bills as paid. Submit a payment instead.",
        403
      )
    );
  }

  const { title, description, dueDate, amount, isCleared, billType } = req.body;
  const bill = res.bill;
  if (title != null) bill.title = String(title).trim();
  if (description != null) bill.description = description;
  if (dueDate != null) bill.dueDate = dueDate;
  if (amount != null) {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return next(new ErrorHandler("Amount must be a positive number", 400));
    }
    bill.amount = parsedAmount;
  }
  if (billType != null) bill.billType = billType;
  if (isCleared != null) {
    bill.isCleared = Boolean(isCleared);
    bill.paymentStatus = isCleared ? "PAID" : "UNPAID";
    bill.clearedAt = isCleared ? bill.clearedAt || new Date() : null;
    bill.receiptNumber = isCleared
      ? bill.receiptNumber || makeReceiptNumber()
      : null;
  }

  const updatedBill = await bill.save();
  await Promise.all([
    updatedBill.populate("user", "name email unitNumber profilePicture"),
    recordAudit({
      req,
      action: "BILL_UPDATED",
      targetModel: "Bill",
      targetId: bill._id,
      details: { isCleared: bill.isCleared, amount: bill.amount },
    }),
  ]);
  res.json(updatedBill);
});

const submitPayment = catchAsyncErrors(async (req, res, next) => {
  const bill = res.bill;
  if (String(bill.user) !== String(req.user._id)) {
    return next(new ErrorHandler("You can only pay your own bill", 403));
  }
  if (bill.isCleared || bill.paymentStatus === "PAID") {
    return next(new ErrorHandler("Bill is already paid", 409));
  }

  const provider = String(req.body.provider || "").toUpperCase();
  if (!["STRIPE", "PAYPAL", "BANK_TRANSFER", "CASH"].includes(provider)) {
    return next(new ErrorHandler("Unsupported payment provider", 400));
  }
  const payment = await Payment.create({
    bill: bill._id,
    user: req.user._id,
    amount: bill.amount,
    provider,
    metadata:
      provider === "BANK_TRANSFER"
        ? { transferReference: req.body.transferReference || null }
        : {},
  });
  bill.paymentStatus = "PENDING";
  await bill.save();

  if (provider === "STRIPE") {
    if (!process.env.STRIPE_SECRET_KEY) {
      payment.status = "FAILED";
      payment.failureReason = "Stripe is not configured";
      bill.paymentStatus = "FAILED";
      await Promise.all([payment.save(), bill.save()]);
      return next(
        new ErrorHandler(
          "Stripe is not configured. Add STRIPE_SECRET_KEY first.",
          503
        )
      );
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3001";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(payment._id),
      success_url:
        process.env.STRIPE_SUCCESS_URL ||
        `${frontendUrl}/resident?payment=success`,
      cancel_url:
        process.env.STRIPE_CANCEL_URL ||
        `${frontendUrl}/resident?payment=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (
              process.env.PAYMENT_CURRENCY || "pkr"
            ).toLowerCase(),
            unit_amount: Math.round(bill.amount * 100),
            product_data: {
              name: bill.title,
              description: bill.description || `Guardora bill for ${bill.month}`,
            },
          },
        },
      ],
      metadata: {
        billId: String(bill._id),
        paymentId: String(payment._id),
        userId: String(req.user._id),
      },
      payment_intent_data: {
        metadata: {
          billId: String(bill._id),
          paymentId: String(payment._id),
          userId: String(req.user._id),
        },
      },
    });
    payment.externalReference = session.id;
    await payment.save();
    return res.status(201).json({
      payment,
      checkoutUrl: session.url,
      message: "Continue to secure Stripe Checkout",
    });
  }

  if (provider === "PAYPAL") {
    try {
      const { token, baseUrl } = await paypalAccessToken();
      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": String(payment._id),
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: String(payment._id),
              description: bill.title,
              amount: {
                currency_code: (
                  process.env.PAYMENT_CURRENCY || "PKR"
                ).toUpperCase(),
                value: Number(bill.amount).toFixed(2),
              },
            },
          ],
        }),
      });
      const order = await response.json();
      if (!response.ok || !order.id) {
        throw new Error(
          order.message ||
            order.details?.[0]?.description ||
            "PayPal rejected the order"
        );
      }
      payment.externalReference = order.id;
      payment.metadata = {
        ...payment.metadata,
        approvalUrl:
          order.links?.find((link) => link.rel === "approve")?.href || null,
      };
      await payment.save();
      return res.status(201).json({
        payment,
        orderId: order.id,
        approvalUrl: payment.metadata.approvalUrl,
        message: "Approve the PayPal order, then capture it",
      });
    } catch (error) {
      payment.status = "FAILED";
      payment.failureReason = error.message;
      bill.paymentStatus = "FAILED";
      await Promise.all([payment.save(), bill.save()]);
      return next(new ErrorHandler(error.message, 503));
    }
  }

  await recordAudit({
    req,
    action: "PAYMENT_SUBMITTED",
    targetModel: "Payment",
    targetId: payment._id,
    details: { billId: bill._id, provider, amount: bill.amount },
  });
  res.status(201).json({
    payment,
    message: "Payment submitted for administrator confirmation",
  });
});

const capturePayPalPayment = catchAsyncErrors(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment || payment.provider !== "PAYPAL") {
    return next(new ErrorHandler("PayPal payment not found", 404));
  }
  if (String(payment.user) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  const bill = await Bill.findById(payment.bill);
  if (!bill) return next(new ErrorHandler("Bill not found", 404));
  if (payment.status === "SUCCEEDED") {
    return res.json({ payment, bill });
  }
  if (!payment.externalReference) {
    return next(new ErrorHandler("PayPal order is unavailable", 409));
  }

  const { token, baseUrl } = await paypalAccessToken();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${payment.externalReference}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const capture = await response.json();
  if (!response.ok || capture.status !== "COMPLETED") {
    return next(
      new ErrorHandler(
        capture.message ||
          capture.details?.[0]?.description ||
          "PayPal payment is not complete",
        409
      )
    );
  }
  payment.metadata = {
    ...payment.metadata,
    captureId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id,
  };
  const result = await completePayment(payment, bill);
  await recordAudit({
    req,
    action: "PAYPAL_PAYMENT_CAPTURED",
    targetModel: "Payment",
    targetId: payment._id,
    details: { billId: bill._id, orderId: payment.externalReference },
  });
  res.json(result);
});

const handleStripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Stripe webhook is not configured" });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Invalid Stripe webhook: ${error.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const payment = await Payment.findOne({
        $or: [
          { externalReference: session.id },
          ...(session.metadata?.paymentId
            ? [{ _id: session.metadata.paymentId }]
            : []),
        ],
      });
      if (payment) {
        const bill = await Bill.findById(payment.bill);
        if (bill) await completePayment(payment, bill);
      }
    } else if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const payment = intent.metadata?.paymentId
        ? await Payment.findById(intent.metadata.paymentId)
        : null;
      if (payment) {
        const bill = await Bill.findById(payment.bill);
        if (bill) await completePayment(payment, bill);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const payment = await Payment.findOne({ externalReference: intent.id });
      if (payment && payment.status === "PENDING") {
        payment.status = "FAILED";
        payment.failureReason =
          intent.last_payment_error?.message || "Stripe payment failed";
        const bill = await Bill.findById(payment.bill);
        if (bill && !bill.isCleared) bill.paymentStatus = "FAILED";
        await Promise.all([payment.save(), bill?.save()]);
      }
    }
    return res.json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const confirmPayment = catchAsyncErrors(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) return next(new ErrorHandler("Payment not found", 404));
  if (payment.status !== "PENDING") {
    return next(new ErrorHandler("Payment is no longer pending", 409));
  }

  const bill = await Bill.findById(payment.bill);
  if (!bill) return next(new ErrorHandler("Bill not found", 404));
  const approved = req.body.approved !== false;
  if (approved) {
    await completePayment(payment, bill, false);
  } else {
    payment.status = "FAILED";
    payment.failureReason = req.body.reason || "Rejected by administrator";
    bill.paymentStatus = "FAILED";
    await Promise.all([payment.save(), bill.save()]);
  }
  await Promise.all([
    createNotification({
      recipient: payment.user,
      type: "BILLING",
      title: approved ? "Payment confirmed" : "Payment rejected",
      message: approved
        ? `Receipt ${payment.receiptNumber} has been issued.`
        : payment.failureReason,
      link: "/finance",
      metadata: { billId: bill._id, paymentId: payment._id },
    }),
    recordAudit({
      req,
      action: approved ? "PAYMENT_CONFIRMED" : "PAYMENT_REJECTED",
      targetModel: "Payment",
      targetId: payment._id,
      details: { billId: bill._id },
    }),
  ]);
  res.json({ payment, bill });
});

const getReceipt = catchAsyncErrors(async (req, res, next) => {
  const bill = res.bill;
  if (!canManageBilling(req.user) && String(bill.user) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  if (!bill.isCleared || !bill.receiptNumber) {
    return next(new ErrorHandler("No receipt is available for this bill", 404));
  }
  await bill.populate("user", "name email unitNumber");
  res.json({
    receiptNumber: bill.receiptNumber,
    issuedAt: bill.clearedAt,
    amount: bill.amount,
    currency: process.env.PAYMENT_CURRENCY || "PKR",
    bill: {
      id: bill._id,
      title: bill.title,
      month: bill.month,
      type: bill.billType,
    },
    resident: bill.user,
  });
});

const downloadReceiptPdf = catchAsyncErrors(async (req, res, next) => {
  const bill = res.bill;
  if (!canManageBilling(req.user) && String(bill.user) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }
  if (!bill.isCleared || !bill.receiptNumber) {
    return next(new ErrorHandler("No receipt is available for this bill", 404));
  }
  await bill.populate("user", "name email unitNumber");
  sendPdf(res, `${bill.receiptNumber}.pdf`, {
    title: "Guardora Payment Receipt",
    lines: [
      `Receipt: ${bill.receiptNumber}`,
      `Issued: ${bill.clearedAt?.toISOString() || new Date().toISOString()}`,
      `Resident: ${bill.user?.name || ""}`,
      `Unit: ${bill.user?.unitNumber || ""}`,
      `Email: ${bill.user?.email || ""}`,
      `Bill: ${bill.title}`,
      `Month: ${bill.month}`,
      `Type: ${bill.billType}`,
      `Amount: ${process.env.PAYMENT_CURRENCY || "PKR"} ${Number(bill.amount).toFixed(2)}`,
      "Status: PAID",
      "",
      "This receipt was generated electronically by Guardora.",
    ],
  });
});

const downloadMonthlyStatementPdf = catchAsyncErrors(async (req, res, next) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return next(new ErrorHandler("Month must use YYYY-MM format", 400));
  }
  const bills = await Bill.find({ user: req.user._id, month }).sort({
    dueDate: 1,
  });
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const paid = bills
    .filter((bill) => bill.isCleared)
    .reduce((sum, bill) => sum + Number(bill.amount), 0);
  sendPdf(res, `guardora-statement-${month}.pdf`, {
    title: `Guardora Statement - ${month}`,
    lines: [
      `Resident: ${req.user.name}`,
      `Unit: ${req.user.unitNumber || ""}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...bills.map(
        (bill) =>
          `${bill.title} | ${bill.paymentStatus} | ${process.env.PAYMENT_CURRENCY || "PKR"} ${Number(bill.amount).toFixed(2)}`
      ),
      "",
      `Total: ${process.env.PAYMENT_CURRENCY || "PKR"} ${total.toFixed(2)}`,
      `Paid: ${process.env.PAYMENT_CURRENCY || "PKR"} ${paid.toFixed(2)}`,
      `Outstanding: ${process.env.PAYMENT_CURRENCY || "PKR"} ${(total - paid).toFixed(2)}`,
    ],
  });
});

const applyLateFees = catchAsyncErrors(async (req, res, next) => {
  const percentage = Number(req.body.percentage ?? 5);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return next(new ErrorHandler("Late-fee percentage must be 0-100", 400));
  }
  const overdueBills = await Bill.find({
    isCleared: false,
    dueDate: { $lt: new Date() },
    lateFee: 0,
  });
  for (const bill of overdueBills) {
    const base = bill.originalAmount ?? bill.amount;
    bill.originalAmount = base;
    bill.lateFee = Math.round(base * (percentage / 100) * 100) / 100;
    bill.amount = base + bill.lateFee;
    await bill.save();
  }
  await recordAudit({
    req,
    action: "LATE_FEES_APPLIED",
    targetModel: "Bill",
    details: { count: overdueBills.length, percentage },
  });
  res.json({ updated: overdueBills.length, percentage });
});

const deleteBill = catchAsyncErrors(async (req, res) => {
  await Promise.all([
    Payment.deleteMany({ bill: res.bill._id }),
    res.bill.deleteOne(),
  ]);
  await recordAudit({
    req,
    action: "BILL_DELETED",
    targetModel: "Bill",
    targetId: res.bill._id,
  });
  res.json({ message: "Bill deleted" });
});

const getBillingStats = catchAsyncErrors(async (req, res) => {
  const [
    totalBills,
    pendingBills,
    clearedBills,
    totalAmount,
    pendingAmount,
    overdueBills,
  ] = await Promise.all([
    Bill.countDocuments(),
    Bill.countDocuments({ isCleared: false }),
    Bill.countDocuments({ isCleared: true }),
    Bill.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Bill.aggregate([
      { $match: { isCleared: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Bill.countDocuments({ isCleared: false, dueDate: { $lt: new Date() } }),
  ]);
  res.status(200).json({
    totalBills,
    pendingBills,
    clearedBills,
    overdueBills,
    totalAmount: totalAmount[0]?.total || 0,
    pendingAmount: pendingAmount[0]?.total || 0,
  });
});

const getBill = catchAsyncErrors(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) return next(new ErrorHandler("Bill not found", 404));
  res.bill = bill;
  next();
});

export {
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
  handleStripeWebhook,
  confirmPayment,
  getReceipt,
  downloadReceiptPdf,
  downloadMonthlyStatementPdf,
  applyLateFees,
  deleteBill,
  getBillingStats,
};
