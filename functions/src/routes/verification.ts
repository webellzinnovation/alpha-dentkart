import express from 'express';
import {
  submitVerification,
  getUserVerifications,
  getVerificationsByUserId,
  getVerificationById,
  getAllVerifications,
  updateVerificationStatus,
  deleteVerification,
  getVerificationStats,
  getVerificationAuditLogs,
  getAllVerificationAuditLogs,
  uploadVerificationFile
} from '../controllers/verificationController';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// User routes
router.post('/submit', authenticateToken, uploadVerificationFile, submitVerification);
router.get('/my-verifications', authenticateToken, getUserVerifications);
router.get('/:id', authenticateToken, getVerificationById);
router.get('/:id/audit-logs', authenticateToken, getVerificationAuditLogs);
router.delete('/:id', authenticateToken, deleteVerification);

// Admin routes
router.get('/', authenticateToken, getAllVerifications);
router.get('/user/:userId', authenticateToken, getVerificationsByUserId);
router.put('/:id/status', authenticateToken, updateVerificationStatus);
router.get('/admin/stats', authenticateToken, getVerificationStats);
router.get('/admin/audit-logs', authenticateToken, getAllVerificationAuditLogs);

export default router;