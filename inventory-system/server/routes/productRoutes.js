import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Publicly accessible for logged-in users
router.get('/', authenticateToken, getProducts);
router.get('/categories', authenticateToken, getCategories);
router.get('/:id', authenticateToken, getProductById);

// Admin-only endpoints
router.post('/', authenticateToken, requireRole('ADMIN'), createProduct);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteProduct);

export default router;
