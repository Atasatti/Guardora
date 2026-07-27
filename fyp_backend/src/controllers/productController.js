import Product from "../models/product.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import User from "../models/user.js";
import ModerationCase from "../models/moderationCase.js";
import { checkContentSafety } from "../utils/aiModerator.js";

// Get all products
const getAllProducts = catchAsyncErrors(async (req, res) => {
  const { query, category } = req.query;

  let filter = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter)
    .populate(
      "sellerId",
      "name profilePicture unitNumber sellerStats.totalProducts sellerStats.itemsSold"
    )
    .sort({ createdAt: -1 });

  res.json(products);
});

// Get product by ID
const getProductById = catchAsyncErrors(async (req, res) => {
  res.json(res.product);
});

// Create a new product
const createProduct = catchAsyncErrors(async (req, res) => {
  const { title, description, price, category } = req.body;
  const sellerId = req.user.id;

  // Get uploaded image URLs
  const images = req.files
    ? req.files.map((file) => `uploads/${file.filename}`)
    : [];

  const product = new Product({
    sellerId,
    title,
    description,
    price,
    category,
    images,
  });

  const newProduct = await product.save();

  // --- AI MODERATION TRIGGER ---
  // Combine title and description for context
  const textToScan = `Product Title: ${title}. Description: ${description}`;

  checkContentSafety(textToScan, "Marketplace Product")
    .then(async (aiResult) => {
      if (!aiResult.isSafe) {
        console.log(
          `[Moderation] Product ${newProduct._id} flagged: ${aiResult.flaggedCategory}`
        );
        await ModerationCase.create({
          targetId: newProduct._id,
          targetModel: "Product",
          reason: aiResult.flaggedCategory,
          flaggedContentSnippet: textToScan.substring(0, 150),
          aiConfidence: aiResult.confidence,
        });
      }
    })
    .catch((err) => console.error("Moderation Trigger Failed:", err));
  // -----------------------------

  await User.findByIdAndUpdate(sellerId, {
    $inc: { "sellerStats.totalProducts": 1 },
  });

  await newProduct.populate("sellerId", "name profilePicture unitNumber");
  res.status(201).json(newProduct);
});

// Update an existing product
const updateProduct = catchAsyncErrors(async (req, res) => {
  const { title, description, price, category, images, status } = req.body;

  if (title != null) res.product.title = title;
  if (description != null) res.product.description = description;
  if (price != null) res.product.price = price;
  if (category != null) res.product.category = category;
  if (images != null) res.product.images = images;
  if (status != null) res.product.status = status;

  const updatedProduct = await res.product.save();
  await updatedProduct.populate("sellerId", "name profilePicture unitNumber");
  res.json(updatedProduct);
});

// Delete a product
const deleteProduct = catchAsyncErrors(async (req, res) => {
  const sellerId = res.product.sellerId?._id || res.product.sellerId;
  await res.product.deleteOne();
  await User.findByIdAndUpdate(sellerId, {
    $inc: { "sellerStats.totalProducts": -1 },
  });
  res.json({ message: "Product deleted" });
});

// Get user's products
const getUserProducts = catchAsyncErrors(async (req, res) => {
  const userId = req.params.userId;
  const products = await Product.find({ sellerId: userId })
    .populate("sellerId", "name profilePicture unitNumber")
    .sort({ createdAt: -1 });
  res.status(200).json(products);
});

// Update product status
const updateProductStatus = catchAsyncErrors(async (req, res) => {
  const { status } = req.body;

  if (status != null) res.product.status = status;

  const updatedProduct = await res.product.save();
  await updatedProduct.populate("sellerId", "name profilePicture unitNumber");
  res.json(updatedProduct);
});

// Middleware to fetch product by ID
const getProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "sellerId",
    "name profilePicture unitNumber"
  );

  if (product == null) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.product = product;
  next();
});

export {
  getProduct,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  updateProductStatus,
};
