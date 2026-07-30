import express from 'express';
import {
  getPost,
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getUserPosts,
} from '../controllers/postController.js';
import { isUserAuthenticated } from '../middlewares/auth.js';
import upload from '../multer.js';

const router = express.Router();

// Get all posts
router.get('/', isUserAuthenticated, getAllPosts);

// Get user's posts
router.get('/user/:userId', isUserAuthenticated, getUserPosts);

// Create a new post
router.post('/', isUserAuthenticated, upload.array('images'), createPost);

// Get post by ID
router.get('/:id', isUserAuthenticated, getPost, getPostById);

// Update a post
router.put('/:id', isUserAuthenticated, getPost, updatePost);

// Delete a post
router.delete('/:id', isUserAuthenticated, getPost, deletePost);

// Like a post
router.post('/:id/like', isUserAuthenticated, getPost, likePost);

export default router;
