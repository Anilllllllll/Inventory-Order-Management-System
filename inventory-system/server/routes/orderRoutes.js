import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  previewQuotation
} from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createOrder);
router.post('/preview-quotation', authenticateToken, previewQuotation);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);

// Admin-only: update order status
router.patch('/:id/status', authenticateToken, requireRole('ADMIN'), updateOrderStatus);

export default router;
