import { Router } from 'express';
import { updateUser, deleteUser, getAllUsers, updateUserByEmail } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all routes with admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/all', getAllUsers);
router.put('/by-email', updateUserByEmail);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
