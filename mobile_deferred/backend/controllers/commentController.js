import Comment from "../../../backend/src/models/comment.js";
import Post from "../../../backend/src/models/post.js";
import catchAsyncErrors from "../../../backend/src/middlewares/catchAsyncErrors.js";
import ErrorHandler from "../../../backend/src/utils/ErrorHandler.js";

// Get all comments for a post
const getAllComments = catchAsyncErrors(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate("author", "name profilePicture")
    .sort({ createdAt: -1 });
  res.status(200).json(comments);
});

// Get comment by ID
const getCommentById = catchAsyncErrors(async (req, res) => {
  res.json(res.comment);
});

// Create a new comment
const createComment = catchAsyncErrors(async (req, res) => {
  const { text } = req.body;
  const author = req.user.id;
  const postId = req.params.postId;



  const comment = new Comment({
    author,
    post: postId,
    text,
  });

  const newComment = await comment.save();
  await newComment.populate("author", "name profilePicture");

  // Update post's comments count
  await Post.findByIdAndUpdate(postId, {
    $push: { comments: newComment._id },
    $inc: { totalComments: 1 },
  });

  res.status(201).json(newComment);
});

// Update an existing comment
const updateComment = catchAsyncErrors(async (req, res) => {
  const { text } = req.body;

  if (text != null) res.comment.text = text;

  const updatedComment = await res.comment.save();
  await updatedComment.populate("author", "name profilePicture");
  res.json(updatedComment);
});

// Delete a comment
const deleteComment = catchAsyncErrors(async (req, res) => {
  // Remove comment from post's comments array
  await Post.findByIdAndUpdate(res.comment.post, {
    $pull: { comments: res.comment._id },
    $inc: { totalComments: -1 },
  });

  await res.comment.deleteOne();
  res.json({ message: "Comment deleted" });
});

// Middleware to fetch comment by ID
const getComment = catchAsyncErrors(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate(
    "author",
    "name profilePicture"
  );

  if (comment == null) {
    return next(new ErrorHandler("Comment not found", 404));
  }

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
