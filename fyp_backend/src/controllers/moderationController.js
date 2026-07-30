import ModerationCase from "../models/moderationCase.js";
import Post from "../models/post.js";
import Product from "../models/product.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { createNotification } from "../utils/notifications.js";
import { recordAudit } from "../utils/audit.js";

// 1. Get All Open Cases
const getModerationCases = catchAsyncErrors(async (req, res) => {
  const cases = await ModerationCase.find({ status: "OPEN" })
    .populate("targetId") // Magic: Populates either the Post or Product object
    .sort({ createdAt: -1 });

  res.json({ success: true, cases });
});

// 2. Resolve Case
const resolveCase = catchAsyncErrors(async (req, res) => {
  const { action } = req.body; // Expected: "BAN" or "DISMISS"
  const modCase = await ModerationCase.findById(req.params.id);

  if (!modCase) {
    return res.status(404).json({ message: "Moderation Case not found" });
  }

  if (action === "BAN") {
    // Delete the actual content from the database
    if (modCase.targetModel === "Post") {
      const post = await Post.findById(modCase.targetId);
      if (post) {
        await Post.deleteOne({ _id: post._id });
        await createNotification({
          recipient: post.author,
          type: "SYSTEM",
          title: "Post removed by moderation",
          message: modCase.reason,
          link: "/social",
          metadata: { moderationCaseId: modCase._id },
        });
      }
    } else if (modCase.targetModel === "Product") {
      const product = await Product.findById(modCase.targetId);
      if (product) {
        product.status = "DELETED";
        await product.save();
        await createNotification({
          recipient: product.sellerId,
          type: "SYSTEM",
          title: "Listing removed by moderation",
          message: modCase.reason,
          link: "/social",
          metadata: { moderationCaseId: modCase._id },
        });
      }
    }

    modCase.status = "RESOLVED_BANNED";
  } else if (action === "DISMISS") {
    // Keep content, close case
    modCase.status = "RESOLVED_DISMISSED";
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await modCase.save();
  await recordAudit({
    req,
    action: `MODERATION_CASE_${action}`,
    targetModel: "ModerationCase",
    targetId: modCase._id,
    details: { targetModel: modCase.targetModel, targetId: modCase.targetId },
  });
  res.json({ success: true, message: `Case resolved: ${action}` });
});

export { getModerationCases, resolveCase };
