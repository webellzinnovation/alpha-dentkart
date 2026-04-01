"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVerificationFile = exports.getAllVerificationAuditLogs = exports.getVerificationAuditLogs = exports.getVerificationStats = exports.deleteVerification = exports.updateVerificationStatus = exports.getAllVerifications = exports.getVerificationById = exports.getUserVerifications = exports.submitVerification = void 0;
const multer_1 = __importDefault(require("multer"));
const verificationService_1 = __importDefault(require("../services/verificationService"));
const logger_1 = __importDefault(require("../utils/logger"));
// No longer need Prisma Client here, as Service handles DB and is migrated
const verificationService = new verificationService_1.default(); // Removed prisma arg
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
        }
    }
});
// Submit verification document
const submitVerification = async (req, res) => {
    try {
        const userId = req.user?.id; // Check check auth middleware if it sets userId or id
        // Auth middleware sets req.user = { userId: string ... } usually?
        // Let's assume standard. If previous code used userId, we stick to it.
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { documentType, licenseId, licenseState, specialization, institution, studentId, gstNumber, businessName } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const submissionData = {
            userId,
            documentType: documentType,
            file: {
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            },
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
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in submitVerification:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.submitVerification = submitVerification;
// Get user's verification documents
const getUserVerifications = async (req, res) => {
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
    }
    catch (error) {
        logger_1.default.error('Error in getUserVerifications:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getUserVerifications = getUserVerifications;
// Get verification by ID
const getVerificationById = async (req, res) => {
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
    }
    catch (error) {
        logger_1.default.error('Error in getVerificationById:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getVerificationById = getVerificationById;
// Get all verifications (admin only)
const getAllVerifications = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        const { status, documentType, limit = 50, offset = 0 } = req.query;
        const result = await verificationService.getAllVerifications({
            status: status,
            documentType: documentType,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        return res.status(200).json({
            success: true,
            documents: result.documents,
            total: result.total
        });
    }
    catch (error) {
        logger_1.default.error('Error in getAllVerifications:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getAllVerifications = getAllVerifications;
// Update verification status (admin only)
const updateVerificationStatus = async (req, res) => {
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
        const result = await verificationService.updateVerificationStatus(verificationId, status, {
            userId: document.userId,
            performedBy: reviewerId,
            notes,
            rejectionReason
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: `Verification ${status} successfully`,
                document: result.document
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in updateVerificationStatus:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.updateVerificationStatus = updateVerificationStatus;
// Delete verification
const deleteVerification = async (req, res) => {
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
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in deleteVerification:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.deleteVerification = deleteVerification;
// Get verification statistics (admin only)
const getVerificationStats = async (req, res) => {
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
    }
    catch (error) {
        logger_1.default.error('Error in getVerificationStats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getVerificationStats = getVerificationStats;
// Get verification audit logs
const getVerificationAuditLogs = async (req, res) => {
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
    }
    catch (error) {
        logger_1.default.error('Error in getVerificationAuditLogs:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getVerificationAuditLogs = getVerificationAuditLogs;
// Get all verification audit logs (admin only)
const getAllVerificationAuditLogs = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        const { action, limit = 100, offset = 0 } = req.query;
        const result = await verificationService.getAllVerificationAuditLogs({
            action: action,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        return res.status(200).json({
            success: true,
            logs: result.logs,
            total: result.total
        });
    }
    catch (error) {
        logger_1.default.error('Error in getAllVerificationAuditLogs:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getAllVerificationAuditLogs = getAllVerificationAuditLogs;
// Upload middleware for verification routes
exports.uploadVerificationFile = upload.single('document');
exports.default = {
    submitVerification: exports.submitVerification,
    getUserVerifications: exports.getUserVerifications,
    getVerificationById: exports.getVerificationById,
    getAllVerifications: exports.getAllVerifications,
    updateVerificationStatus: exports.updateVerificationStatus,
    deleteVerification: exports.deleteVerification,
    getVerificationStats: exports.getVerificationStats,
    getVerificationAuditLogs: exports.getVerificationAuditLogs,
    getAllVerificationAuditLogs: exports.getAllVerificationAuditLogs,
    uploadVerificationFile: exports.uploadVerificationFile
};
//# sourceMappingURL=verificationController.js.map