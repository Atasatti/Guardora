import path from "path";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import ModerationCase from "../models/moderationCase.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { checkContentSafety } from "../utils/aiModerator.js";
import { recordAudit } from "../utils/audit.js";

const canManagePost = (req, post) => {
  const authorId = post.author?._id || post.author;
  return (
    String(authorId) === String(req.user._id) ||
    req.user.role === "ADMIN" ||
    (req.user.role === "MODERATOR" &&
      req.user.permissions?.includes("MANAGE_CONTENT"))
  );
};

// Get all posts
const getAllPosts = catchAsyncErrors(async (req, res) => {
  const { query } = req.query;
  if (query) {
    const posts = await Post.find({
      $or: [{ description: { $regex: query, $options: "i" } }],
    })
      .populate("author", "name profilePicture unitNumber")
      .sort({ createdAt: -1 });

    res.json(posts);
  } else {
    const posts = await Post.find()
      .populate("author", "name profilePicture unitNumber")
      .sort({ createdAt: -1 });
    res.json(posts);
  }
});

// Get post by ID
const getPostById = catchAsyncErrors(async (req, res) => {
  res.json(res.post);
});

// Create a new post
const createPost = catchAsyncErrors(async (req, res, next) => {
  const { description } = req.body;
  const author = req.user.id;
  if (!String(description || "").trim()) {
    return next(new ErrorHandler("Post description is required", 400));
  }

  // Get uploaded image URLs - use the same path format as profile picture
  const images = req.files
    ? req.files.map((file) => path.join("uploads", file.filename))
    : [];

  const post = new Post({
    author,
    description: description.trim(),
    images: images, // Use the same path format: "uploads/filename.jpg"
  });

  const newPost = await post.save();

  // AI CHECK FOR MODERATION
  checkContentSafety(description, "Social Post")
    .then(async (aiResult) => {
      if (!aiResult.isSafe) {
        console.log(
          `[Moderation] Post ${newPost._id} flagged: ${aiResult.flaggedCategory}`
        );
        await ModerationCase.create({
          targetId: newPost._id,
          targetModel: "Post",
          reason: aiResult.flaggedCategory, // e.g. "Hate Speech"
          flaggedContentSnippet: description.substring(0, 150),
          aiConfidence: aiResult.confidence,
        });
      }
    })
    .catch((err) => console.error("Moderation Trigger Failed:", err));

  await newPost.populate("author", "name profilePicture unitNumber");
  res.status(201).json(newPost);
});

// Update an existing post
const updatePost = catchAsyncErrors(async (req, res, next) => {
  const { description, images } = req.body;

  if (!canManagePost(req, res.post)) {
    return next(new ErrorHandler("Not authorized to update this post", 403));
  }

  if (description != null) res.post.description = description;
  if (images != null) res.post.images = images;

  const updatedPost = await res.post.save();
  await updatedPost.populate("author", "name profilePicture unitNumber");
  res.json(updatedPost);
});

// Delete a post
const deletePost = catchAsyncErrors(async (req, res, next) => {
  if (!canManagePost(req, res.post)) {
    return next(new ErrorHandler("Not authorized to delete this post", 403));
  }

  await Comment.deleteMany({ _id: { $in: res.post.comments } });
  const postId = res.post._id;
  await res.post.deleteOne();
  await recordAudit({
    req,
    action: "POST_DELETED",
    targetModel: "Post",
    targetId: postId,
  });
  res.json({ message: "Post deleted" });
});

// Like a post
const likePost = catchAsyncErrors(async (req, res) => {
  const userId = req.user.id;
  const post = res.post;

  if (post.likes.some((id) => String(id) === String(userId))) {
    post.likes.pull(userId);
    post.totalLikes -= 1;
  } else {
    post.likes.push(userId);
    post.totalLikes += 1;
  }

  const updatedPost = await post.save();
  await updatedPost.populate("author", "name profilePicture unitNumber");
  res.json(updatedPost);
});

// Get user's posts
const getUserPosts = catchAsyncErrors(async (req, res) => {
  const userId = req.params.userId;
  const posts = await Post.find({ author: userId })
    .populate("author", "name profilePicture unitNumber")
    .sort({ createdAt: -1 });
  res.status(200).json(posts);
});

// Middleware to fetch post by ID
const getPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "name profilePicture unitNumber"
  );

  if (post == null) {
    return next(new ErrorHandler("Post not found", 404));
  }

  res.post = post;
  next();
});

export {
  getPost,
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getUserPosts,
};
