import Comment from "../models/comment.js";
import Post from "../models/post.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { recordAudit } from "../utils/audit.js";

const canManageComment = (req, comment) =>
  String(comment.author?._id || comment.author) === String(req.user._id) ||
  req.user.role === "ADMIN" ||
  (req.user.role === "MODERATOR" &&
    req.user.permissions?.includes("MANAGE_CONTENT"));

const getAllComments = catchAsyncErrors(async (req, res, next) => {
  const postExists = await Post.exists({ _id: req.params.postId });
  if (!postExists) return next(new ErrorHandler("Post not found", 404));
  const comments = await Comment.find({ post: req.params.postId })
    .populate("author", "name profilePicture unitNumber")
    .sort({ createdAt: 1 });
  res.json(comments);
});

const getCommentById = catchAsyncErrors(async (req, res) => {
  res.json(res.comment);
});

const createComment = catchAsyncErrors(async (req, res, next) => {
  const text = String(req.body.text || "").trim();
  if (!text) return next(new ErrorHandler("Comment text is required", 400));
  const post = await Post.findById(req.params.postId);
  if (!post) return next(new ErrorHandler("Post not found", 404));

  const comment = await Comment.create({
    author: req.user._id,
    post: post._id,
    text,
  });
  post.comments.push(comment._id);
  post.totalComments = post.comments.length;
  await post.save();
  await comment.populate("author", "name profilePicture unitNumber");
  res.status(201).json(comment);
});

const updateComment = catchAsyncErrors(async (req, res, next) => {
  if (!canManageComment(req, res.comment)) {
    return next(new ErrorHandler("Not authorized to edit this comment", 403));
  }
  const text = String(req.body.text || "").trim();
  if (!text) return next(new ErrorHandler("Comment text is required", 400));
  res.comment.text = text;
  await res.comment.save();
  await res.comment.populate("author", "name profilePicture unitNumber");
  res.json(res.comment);
});

const deleteComment = catchAsyncErrors(async (req, res, next) => {
  if (!canManageComment(req, res.comment)) {
    return next(new ErrorHandler("Not authorized to delete this comment", 403));
  }
  await Promise.all([
    Post.findByIdAndUpdate(res.comment.post, {
      $pull: { comments: res.comment._id },
      $inc: { totalComments: -1 },
    }),
    res.comment.deleteOne(),
  ]);
  await recordAudit({
    req,
    action: "POST_COMMENT_DELETED",
    targetModel: "Comment",
    targetId: res.comment._id,
  });
  res.json({ message: "Comment deleted" });
});

const getComment = catchAsyncErrors(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate(
    "author",
    "name profilePicture unitNumber"
  );
  if (!comment) return next(new ErrorHandler("Comment not found", 404));
  res.comment = comment;
  next();
});

export {
  getComment,
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
