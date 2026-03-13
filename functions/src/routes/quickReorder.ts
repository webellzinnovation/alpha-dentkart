import express from 'express';
import {
  createQuickReorder,
  getUserReorders,
  getReorderById,
  cancelReorder,
  getReorderStats,
  getRecommendedReorders
} from '../controllers/quickReorderController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/', authenticateToken, createQuickReorder);
router.get('/', authenticateToken, getUserReorders);
router.get('/stats', authenticateToken, getReorderStats);
router.get('/recommended', authenticateToken, getRecommendedReorders);
router.get('/:id', authenticateToken, getReorderById);
router.put('/:id/cancel', authenticateToken, cancelReorder);

export default router;