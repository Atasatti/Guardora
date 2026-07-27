import ModerationCase from "../models/moderationCase.js";
import Post from "../models/post.js";
import Product from "../models/product.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

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
      await Post.findByIdAndDelete(modCase.targetId);
    } else if (modCase.targetModel === "Product") {
      await Product.findByIdAndDelete(modCase.targetId);
    }

    modCase.status = "RESOLVED_BANNED";
  } else if (action === "DISMISS") {
    // Keep content, close case
    modCase.status = "RESOLVED_DISMISSED";
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await modCase.save();
  res.json({ success: true, message: `Case resolved: ${action}` });
});

export { getModerationCases, resolveCase };
