import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import VerificationService, { VerificationSubmissionData } from '../services/verificationService';
import logger from '../utils/logger';
import { emailService } from '../services/EmailService';
import { db } from '../config/firebase';

// No longer need Prisma Client here, as Service handles DB and is migrated
const verificationService = new VerificationService(); // Removed prisma arg

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Submit verification document
export const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id; // Check check auth middleware if it sets userId or id
    // Auth middleware sets req.user = { userId: string ... } usually?
    // Let's assume standard. If previous code used userId, we stick to it.

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { 
      documentType, 
      licenseId, 
      licenseState, 
      specialization, 
      institution, 
      studentId, 
      gstNumber, 
      businessName,
      fileUrl,
      fileName,
      fileSize,
      mimeType
    } = req.body;

    if (!req.file && !fileUrl) {
      return res.status(400).json({ success: false, error: 'No file uploaded or file URL provided' });
    }

    const submissionData: VerificationSubmissionData = {
      userId,
      documentType: documentType as 'license' | 'certificate' | 'id_proof' | 'clinic_proof',
      fileUrl,
      fileName,
      fileSize: fileSize ? parseInt(fileSize) : undefined,
      mimeType,
      file: req.file ? {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      } : undefined,
      additionalData: {
        licenseId,
        licenseState,
        specialization,
        institution,
        studentId,
        gstNumber,
        businessName
      }
    };

    const result = await verificationService.submitVerification(submissionData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Verification submitted successfully',
        document: result.document
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in submitVerification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's own verification documents
export const getUserVerifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const documents = await verificationService.getVerificationDocuments(userId);

    return res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error('Error in getUserVerifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get verification documents for a specific user (admin only)
export const getVerificationsByUserId = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const documents = await verificationService.getVerificationDocuments(userId);

    return res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error('Error in getVerificationsByUserId:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get verification by ID
export const getVerificationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const verificationId = Array.isArray(id) ? id[0] : id;

    const document = await verificationService.getVerificationById(verificationId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Verification document not found'
      });
    }

    // Check authorization: admin or document owner
    if (userRole !== 'admin' && document.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this document'
      });
    }

    return res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    logger.error('Error in getVerificationById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all verifications (admin only)
export const getAllVerifications = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const {
      status,
      documentType,
      limit = 50,
      offset = 0
    } = req.query;

    const result = await verificationService.getAllVerifications({
      status: status as string,
      documentType: documentType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    return res.status(200).json({
      success: true,
      documents: result.documents,
      total: result.total
    });
  } catch (error) {
    logger.error('Error in getAllVerifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update verification status (admin only)
export const updateVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const verificationId = Array.isArray(id) ? id[0] : id;
    const { status, notes, rejectionReason } = req.body;
    const reviewerId = req.user?.id;

    if (!reviewerId || req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const document = await verificationService.getVerificationById(verificationId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Verification document not found' });
    }

    const result = await verificationService.updateVerificationStatus(
      verificationId,
      status as 'approved' | 'rejected',
      {
        userId: document.userId,
        performedBy: reviewerId,
        notes,
        rejectionReason
      }
    );

    if (result.success) {
      // Send notification email asynchronously
      try {
        const userDoc = await db.collection('users').doc(document.userId).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          emailService.sendVerificationStatusEmail(
            userData.email,
            userData.name || 'User',
            status as 'approved' | 'rejected',
            rejectionReason
          ).catch(err => {
            logger.error('Failed to send verification status email', { error: err, userId: document.userId });
          });
        }
      } catch (emailErr) {
        logger.error('Error fetching user for verification email', { error: emailErr, userId: document.userId });
      }

      return res.status(200).json({
        success: true,
        message: `Verification ${status} successfully`,
        document: result.document
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in updateVerificationStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete verification
export const deleteVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const verificationId = Array.isArray(id) ? id[0] : id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const result = await verificationService.deleteVerification(verificationId, userRole === 'admin' ? undefined : userId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Verification deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in deleteVerification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get verification statistics (admin only)
export const getVerificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const stats = await verificationService.getVerificationStats();

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error in getVerificationStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get verification audit logs
export const getVerificationAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const logs = await verificationService.getVerificationAuditLogs(userId);

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error('Error in getVerificationAuditLogs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all verification audit logs (admin only)
export const getAllVerificationAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const {
      action,
      limit = 100,
      offset = 0
    } = req.query;

    const result = await verificationService.getAllVerificationAuditLogs({
      action: action as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    return res.status(200).json({
      success: true,
      logs: result.logs,
      total: result.total
    });
  } catch (error) {
    logger.error('Error in getAllVerificationAuditLogs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Upload middleware for verification routes
export const uploadVerificationFile = upload.single('document');

export default {
  submitVerification,
  getUserVerifications,
  getVerificationById,
  getAllVerifications,
  updateVerificationStatus,
  deleteVerification,
  getVerificationStats,
  getVerificationAuditLogs,
  getAllVerificationAuditLogs,
  uploadVerificationFile
};