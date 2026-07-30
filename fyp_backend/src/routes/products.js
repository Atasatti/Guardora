import express from 'express';
import {
  getProduct,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  updateProductStatus,
} from '../controllers/productController.js';
import { isUserAuthenticated } from '../middlewares/auth.js';
import upload from '../multer.js';

const router = express.Router();

// Get all products
router.get('/', isUserAuthenticated, getAllProducts);

// Get user's products
router.get('/user/:userId', isUserAuthenticated, getUserProducts);

// Create a new product
router.post('/', isUserAuthenticated, upload.array('images'), createProduct);

// Get product by ID
router.get('/:id', isUserAuthenticated, getProduct, getProductById);

// Update a product
router.put('/:id', isUserAuthenticated, getProduct, updateProduct);

// Delete a product
router.delete('/:id', isUserAuthenticated, getProduct, deleteProduct);

// Update product status
router.patch('/:id/status', isUserAuthenticated, getProduct, updateProductStatus);

export default router;
