import express from 'express';
import {
  savePaymentMethod,
  getUserPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getPaymentMethodsByGateway,
  getPaymentMethodStats,
  validatePaymentToken
} from '../controllers/savedPaymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/', authenticateToken, savePaymentMethod);
router.get('/', authenticateToken, getUserPaymentMethods);
router.get('/stats', authenticateToken, getPaymentMethodStats);
router.get('/default', authenticateToken, getDefaultPaymentMethod);
router.get('/:id', authenticateToken, getPaymentMethodById);
router.put('/:id', authenticateToken, updatePaymentMethod);
router.delete('/:id', authenticateToken, deletePaymentMethod);
router.put('/:id/default', authenticateToken, setDefaultPaymentMethod);

// Gateway-specific routes
router.get('/gateway/:gateway', authenticateToken, getPaymentMethodsByGateway);

// Validation route
router.post('/validate', authenticateToken, validatePaymentToken);

export default router;