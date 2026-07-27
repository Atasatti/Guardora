import Ad from "../models/ad.js";
import Product from "../models/product.js";
import Service from "../models/service.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// 1. User Applies for an Ad
export const applyForAd = catchAsyncErrors(async (req, res, next) => {
  const { targetId, type, durationDays } = req.body;

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

  // Optional: Check if user owns the item
  // const ownerId = type === "Product" ? item.sellerId : item.providerId;
  // if (ownerId.toString() !== req.user.id) ...

  const ad = await Ad.create({
    advertiser: req.user.id,
    targetItem: targetId,
    targetModel: type, // "Product" or "Service"
    durationDays: durationDays || 7,
    status: "PENDING",
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

  ad.status = status;
  if (adminNote) ad.adminNote = adminNote;

  // If approving, set the expiration date
  if (status === "ACTIVE") {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + ad.durationDays);
    ad.expiresAt = expiry;
  }

  await ad.save();

  res.status(200).json({
    success: true,
    message: `Ad marked as ${status}`,
    ad,
  });
});

// 5. Track Click (Analytics)
export const trackAdClick = catchAsyncErrors(async (req, res, next) => {
  await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
  res.status(200).json({ success: true });
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
