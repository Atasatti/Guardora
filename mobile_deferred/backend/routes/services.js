import express from 'express';
import {
  getService,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getUserServices,
  updateServiceStatus,
} from '../controllers/serviceController.js';
import { isUserAuthenticated } from '../middlewares/auth.js';
import upload from '../multer.js';

const router = express.Router();

// Get all services
router.get('/', getAllServices);

// Get user's services
router.get('/user/:userId', getUserServices);

// Create a new service
router.post('/', isUserAuthenticated, upload.array('images'), createService);

// Get service by ID
router.get('/:id', getService, getServiceById);

// Update a service
router.put('/:id', isUserAuthenticated, getService, updateService);

// Delete a service
router.delete('/:id', isUserAuthenticated, getService, deleteService);

// Update service status
router.patch('/:id/status', isUserAuthenticated, getService, updateServiceStatus);

export default router;