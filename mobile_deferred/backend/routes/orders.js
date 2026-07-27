// routes/orderRoutes.js
import express from 'express';
import {
  getOrder,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getBuyerOrders,
  getSellerOrders,
  getSellerOrderStats,
} from '../controllers/orderController.js';
import { isUserAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Get all orders
router.get('/', getAllOrders);

// Get seller order statistics
router.get('/stats/seller', isUserAuthenticated, getSellerOrderStats);

// Get buyer's orders
router.get('/buyer/:buyerId', getBuyerOrders);

// Get seller's orders
router.get('/seller/:sellerId', getSellerOrders);

// Create a new order
router.post('/', isUserAuthenticated, createOrder);

// Get order by ID
router.get('/:id', getOrder, getOrderById);

// Update order status
router.patch('/:id/status', isUserAuthenticated, getOrder, updateOrderStatus);

// Update payment status
router.patch('/:id/payment', isUserAuthenticated, getOrder, updatePaymentStatus);

// Delete an order
router.delete('/:id', isUserAuthenticated, getOrder, deleteOrder);

export default router;