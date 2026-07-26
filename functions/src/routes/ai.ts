import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { aiPromptSchema } from '../utils/validation';
import { chatWithAI } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

// AI chat endpoint - requires authentication and rate limiting
router.post('/chat', authenticateToken, aiLimiter, validateBody(aiPromptSchema), chatWithAI);

export default router;
