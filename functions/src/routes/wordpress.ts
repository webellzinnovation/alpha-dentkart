import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as wc from '../controllers/wordpressController';

const router = Router();
router.use(authenticateToken, requireAdmin);
router.post('/test-connection', wc.testConnection);
router.post('/sync', wc.syncAll);
router.post('/sync/products', wc.syncProducts);
router.post('/sync/categories', wc.syncCategories);
router.post('/sync/brands', wc.syncBrands);
router.post('/sync/orders', wc.syncOrders);
router.post('/sync/users', wc.syncUsers);
router.post('/sync/reviews', wc.syncReviews);
router.get('/sync/status', wc.getSyncStatus);
export default router;