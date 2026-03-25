import { Router } from 'express';
import { updateUser, updateUserByEmail, deleteUser, getAllUsers } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { auth } from '../config/firebase';

const router = Router();

// Protect all routes with admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/all', getAllUsers);
router.get('/count', async (req, res) => {
    let totalCount = 0;
    let pageToken: string | undefined;
    
    try {
        const firstResult = await auth.listUsers(1000);
        totalCount = firstResult.users.length;
        pageToken = firstResult.pageToken;
        
        while (pageToken) {
            const result = await auth.listUsers(1000, pageToken);
            totalCount += result.users.length;
            pageToken = result.pageToken;
        }
        
        res.json({ total: totalCount });
    } catch (error) {
        console.error('Error counting users:', error);
        res.status(500).json({ error: 'Failed to count users', details: String(error) });
    }
});
router.put('/by-email', updateUserByEmail);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
