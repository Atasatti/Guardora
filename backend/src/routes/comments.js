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

router.get("/post/:postId", isUserAuthenticated, getAllComments);
router.post("/post/:postId", isUserAuthenticated, createComment);
router.get("/:id", isUserAuthenticated, getComment, getCommentById);
router.put("/:id", isUserAuthenticated, getComment, updateComment);
router.delete("/:id", isUserAuthenticated, getComment, deleteComment);

export default router;
