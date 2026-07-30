import Offer from "../models/offer.js";
import Product from "../models/product.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { createNotification } from "../utils/notifications.js";
import { recordAudit } from "../utils/audit.js";

const populateOffer = (query) =>
  query
    .populate("product", "title price images status")
    .populate("buyer", "name profilePicture unitNumber")
    .populate("seller", "name profilePicture unitNumber");

export const createOffer = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.body.productId);
  if (!product || product.status !== "AVAILABLE") {
    return next(new ErrorHandler("Listing is not available", 404));
  }
  if (String(product.sellerId) === String(req.user._id)) {
    return next(new ErrorHandler("You cannot make an offer on your listing", 400));
  }
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return next(new ErrorHandler("A valid offer amount is required", 400));
  }
  const existing = await Offer.exists({
    product: product._id,
    buyer: req.user._id,
    status: "PENDING",
  });
  if (existing) {
    return next(new ErrorHandler("You already have a pending offer", 409));
  }

  const offer = await Offer.create({
    product: product._id,
    buyer: req.user._id,
    seller: product.sellerId,
    amount,
    message: req.body.message || null,
  });
  await Promise.all([
    createNotification({
      recipient: product.sellerId,
      type: "SYSTEM",
      title: `New offer on ${product.title}`,
      message: `${req.user.name} offered PKR ${amount.toLocaleString()}.`,
      link: "/social",
      metadata: { offerId: offer._id, productId: product._id },
    }),
    recordAudit({
      req,
      action: "MARKETPLACE_OFFER_CREATED",
      targetModel: "Offer",
      targetId: offer._id,
      details: { productId: product._id, amount },
    }),
  ]);
  const populatedOffer = await populateOffer(Offer.findById(offer._id));
  res.status(201).json(populatedOffer);
});

export const getMyOffers = catchAsyncErrors(async (req, res) => {
  const offers = await populateOffer(
    Offer.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    }).sort({ createdAt: -1 })
  );
  res.json(offers);
});

export const respondToOffer = catchAsyncErrors(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer || String(offer.seller) !== String(req.user._id)) {
    return next(new ErrorHandler("Offer not found", 404));
  }
  if (offer.status !== "PENDING") {
    return next(new ErrorHandler("Offer is no longer pending", 409));
  }
  const status = String(req.body.status || "").toUpperCase();
  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return next(new ErrorHandler("Status must be ACCEPTED or REJECTED", 400));
  }
  offer.status = status;
  offer.respondedAt = new Date();
  await offer.save();

  if (status === "ACCEPTED") {
    await Promise.all([
      Product.updateOne({ _id: offer.product }, { status: "RESERVED" }),
      Offer.updateMany(
        {
          product: offer.product,
          _id: { $ne: offer._id },
          status: "PENDING",
        },
        { status: "REJECTED", respondedAt: new Date() }
      ),
    ]);
  }
  await Promise.all([
    createNotification({
      recipient: offer.buyer,
      type: "SYSTEM",
      title: `Offer ${status.toLowerCase()}`,
      message:
        status === "ACCEPTED"
          ? "Contact the seller to complete the exchange."
          : "The seller declined your offer.",
      link: "/social",
      metadata: { offerId: offer._id, productId: offer.product },
    }),
    recordAudit({
      req,
      action: `MARKETPLACE_OFFER_${status}`,
      targetModel: "Offer",
      targetId: offer._id,
    }),
  ]);
  res.json(offer);
});

export const withdrawOffer = catchAsyncErrors(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer || String(offer.buyer) !== String(req.user._id)) {
    return next(new ErrorHandler("Offer not found", 404));
  }
  if (offer.status !== "PENDING") {
    return next(new ErrorHandler("Only pending offers can be withdrawn", 409));
  }
  offer.status = "WITHDRAWN";
  offer.respondedAt = new Date();
  await offer.save();
  res.json(offer);
});
