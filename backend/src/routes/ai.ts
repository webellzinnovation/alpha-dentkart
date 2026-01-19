import { Router } from 'express';
import { chatWithAI } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

// AI chat endpoint - requires authentication and rate limiting
router.post('/chat', authenticateToken, aiLimiter, chatWithAI);

export default router;
