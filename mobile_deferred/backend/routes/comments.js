import express from "express";
import {
  getComment,
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// All comments for a specific post
router.get("/post/:postId", getAllComments);
router.post("/post/:postId", isUserAuthenticated, createComment);

// Specific comment operations
router.get("/:id", getComment, getCommentById);
router.put("/:id", getComment, updateComment);
router.delete("/:id", getComment, deleteComment);

export default router;
