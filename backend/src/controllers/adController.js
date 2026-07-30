import Ad from "../models/ad.js";
import Product from "../models/product.js";
import Service from "../models/service.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { createNotification } from "../utils/notifications.js";
import { recordAudit } from "../utils/audit.js";

// 1. User Applies for an Ad
export const applyForAd = catchAsyncErrors(async (req, res, next) => {
  const { targetId, type, durationDays } = req.body;
  const duration = Number(durationDays || 7);
  if (![7, 14, 30].includes(duration)) {
    return next(new ErrorHandler("Ad duration must be 7, 14, or 30 days", 400));
  }

  // Verify the item exists and belongs to the user
  let item;
  if (type === "Product") {
    item = await Product.findById(targetId);
  } else if (type === "Service") {
    item = await Service.findById(targetId);
  } else {
    return next(
      new ErrorHandler("Invalid type. Must be Product or Service", 400)
    );
  }

  if (!item) {
    return next(new ErrorHandler(`${type} not found`, 404));
  }

  const ownerId = type === "Product" ? item.sellerId : item.providerId;
  if (String(ownerId) !== String(req.user._id)) {
    return next(new ErrorHandler("You can only advertise your own listing", 403));
  }
  const duplicate = await Ad.exists({
    targetItem: targetId,
    targetModel: type,
    status: { $in: ["PENDING", "ACTIVE"] },
  });
  if (duplicate) {
    return next(new ErrorHandler("This listing already has an active application", 409));
  }

  const ad = await Ad.create({
    advertiser: req.user._id,
    targetItem: targetId,
    targetModel: type, // "Product" or "Service"
    durationDays: duration,
    status: "PENDING",
  });
  await recordAudit({
    req,
    action: "AD_APPLICATION_SUBMITTED",
    targetModel: "Ad",
    targetId: ad._id,
    details: { targetId, type, durationDays: duration },
  });

  res.status(201).json({
    success: true,
    message: "Ad application submitted successfully",
    ad,
  });
});

// 2. Get My Ads (For User Dashboard)
export const getMyAds = catchAsyncErrors(async (req, res, next) => {
  const ads = await Ad.find({ advertiser: req.user.id })
    .populate("targetItem") // Fetches the full Product/Service object
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    ads,
  });
});

// 3. Get Active Ads (For Social Feed Injection)
export const getActiveAds = catchAsyncErrors(async (req, res, next) => {
  const ads = await Ad.find({
    status: "ACTIVE",
    expiresAt: { $gt: new Date() }, // Only not expired
  })
    .populate("targetItem")
    .populate("advertiser", "name profilePicture");

  res.status(200).json({
    success: true,
    ads,
  });
});

// 4. Admin: Update Status (Approve/Reject)
export const updateAdStatus = catchAsyncErrors(async (req, res, next) => {
  const { status, adminNote } = req.body;
  const ad = await Ad.findById(req.params.id);

  if (!ad) {
    return next(new ErrorHandler("Ad not found", 404));
  }
  if (!["ACTIVE", "REJECTED"].includes(status)) {
    return next(new ErrorHandler("Status must be ACTIVE or REJECTED", 400));
  }

  ad.status = status;
  if (adminNote) ad.adminNote = adminNote;

  // If approving, set the expiration date
  if (status === "ACTIVE") {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + ad.durationDays);
    ad.expiresAt = expiry;
  }

  await ad.save();
  await Promise.all([
    createNotification({
      recipient: ad.advertiser,
      type: "SYSTEM",
      title: `Ad application ${status.toLowerCase()}`,
      message:
        status === "ACTIVE"
          ? `Your ad is active for ${ad.durationDays} days.`
          : adminNote || "Review the application and resubmit it.",
      link: "/ads",
      metadata: { adId: ad._id },
    }),
    recordAudit({
      req,
      action: `AD_APPLICATION_${status}`,
      targetModel: "Ad",
      targetId: ad._id,
      details: { adminNote },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: `Ad marked as ${status}`,
    ad,
  });
});

// 5. Track Click (Analytics)
export const trackAdClick = catchAsyncErrors(async (req, res, next) => {
  const updated = await Ad.findOneAndUpdate(
    { _id: req.params.id, status: "ACTIVE", expiresAt: { $gt: new Date() } },
    { $inc: { clicks: 1 } }
  );
  if (!updated) return next(new ErrorHandler("Active ad not found", 404));
  res.status(200).json({ success: true });
});

export const resubmitAd = catchAsyncErrors(async (req, res, next) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad || String(ad.advertiser) !== String(req.user._id)) {
    return next(new ErrorHandler("Ad application not found", 404));
  }
  if (ad.status !== "REJECTED") {
    return next(new ErrorHandler("Only rejected ads can be resubmitted", 409));
  }
  const duration = Number(req.body.durationDays || ad.durationDays);
  if (![7, 14, 30].includes(duration)) {
    return next(new ErrorHandler("Ad duration must be 7, 14, or 30 days", 400));
  }
  ad.durationDays = duration;
  ad.status = "PENDING";
  ad.adminNote = null;
  ad.expiresAt = null;
  await ad.save();
  await recordAudit({
    req,
    action: "AD_APPLICATION_RESUBMITTED",
    targetModel: "Ad",
    targetId: ad._id,
  });
  res.json(ad);
});

export const getAllAds = catchAsyncErrors(async (req, res, next) => {
  const ads = await Ad.find()
    .populate("advertiser", "name email unitNumber profilePicture")
    .populate("targetItem") // Get the Product/Service details
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    ads,
  });
});
