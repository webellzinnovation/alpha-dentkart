"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
class VerificationService {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedFileTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        this.uploadDir = path_1.default.join(process.cwd(), 'uploads', 'verification');
        this.ensureUploadDirectory();
    }
    ensureUploadDirectory() {
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    validateFileType(mimeType) {
        return this.allowedFileTypes.includes(mimeType);
    }
    validateFileSize(size) {
        return size <= this.maxFileSize;
    }
    generateUniqueFileName(originalName) {
        const ext = path_1.default.extname(originalName);
        const name = path_1.default.basename(originalName, ext);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${name}_${timestamp}_${random}${ext}`;
    }
    async saveFile(file) {
        const fileName = this.generateUniqueFileName(file.originalName);
        const filePath = path_1.default.join(this.uploadDir, fileName);
        await fs_1.default.promises.writeFile(filePath, file.buffer);
        return {
            fileName,
            fileUrl: `/uploads/verification/${fileName}`
        };
    }
    async submitVerification(data) {
        try {
            // Validate file
            if (!this.validateFileType(data.file.mimeType)) {
                return {
                    success: false,
                    error: `Invalid file type: ${data.file.mimeType}. Allowed types: ${this.allowedFileTypes.join(', ')}`
                };
            }
            if (!this.validateFileSize(data.file.size)) {
                return {
                    success: false,
                    error: `File size exceeds maximum limit of 10MB: ${data.file.originalName}`
                };
            }
            // Check for pending verification
            const existingSnapshot = await firebase_1.db.collection('verification_documents')
                .where('userId', '==', data.userId)
                .where('documentType', '==', data.documentType)
                .where('status', '==', 'pending')
                .get();
            if (!existingSnapshot.empty) {
                return {
                    success: false,
                    error: `You already have a ${data.documentType.replace('_', ' ')} verification under review. Please wait for the current verification to be completed.`
                };
            }
            // Save file
            const savedFile = await this.saveFile(data.file);
            // Create doc
            const verificationData = {
                userId: data.userId,
                documentType: data.documentType,
                fileName: savedFile.fileName,
                fileUrl: savedFile.fileUrl,
                fileSize: data.file.size,
                mimeType: data.file.mimeType,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            const docRef = await firebase_1.db.collection('verification_documents').add(verificationData);
            // Update user with additional data
            const updateData = {};
            if (data.additionalData?.licenseId)
                updateData.licenseId = data.additionalData.licenseId;
            if (data.additionalData?.licenseState)
                updateData.licenseState = data.additionalData.licenseState;
            if (data.additionalData?.specialization)
                updateData.specialization = data.additionalData.specialization;
            if (data.additionalData?.institution)
                updateData.institution = data.additionalData.institution;
            if (data.additionalData?.studentId)
                updateData.studentId = data.additionalData.studentId;
            if (data.additionalData?.gstNumber)
                updateData.gstNumber = data.additionalData.gstNumber;
            if (data.additionalData?.businessName)
                updateData.businessName = data.additionalData.businessName;
            if (Object.keys(updateData).length > 0) {
                await firebase_1.db.collection('users').doc(data.userId).set(updateData, { merge: true });
            }
            // Audit log
            await this.createAuditLog({
                userId: data.userId,
                action: 'submitted',
                performedBy: data.userId,
                notes: `${data.documentType} verification submitted`
            });
            return {
                success: true,
                document: { id: docRef.id, ...verificationData }
            };
        }
        catch (error) {
            logger_1.default.error('Error submitting verification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to submit verification'
            };
        }
    }
    async getVerificationDocuments(userId) {
        try {
            const snapshot = await firebase_1.db.collection('verification_documents')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            // Mock join with user if needed, but here we just return docs usually
            // For consistency with Prisma include:
            const userDoc = await firebase_1.db.collection('users').doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                user: {
                    id: userId,
                    name: userData?.name,
                    email: userData?.email,
                    phone: userData?.phone
                }
            }));
        }
        catch (error) {
            logger_1.default.error('Error fetching verification documents:', error);
            return [];
        }
    }
    async getVerificationById(documentId) {
        try {
            const doc = await firebase_1.db.collection('verification_documents').doc(documentId).get();
            if (!doc.exists)
                return null;
            const data = doc.data();
            const userDoc = await firebase_1.db.collection('users').doc(data.userId).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            return {
                id: doc.id,
                ...data,
                user: {
                    id: data.userId,
                    name: userData?.name,
                    email: userData?.email,
                    phone: userData?.phone,
                    userType: userData?.userType,
                    licenseId: userData?.licenseId,
                    licenseState: userData?.licenseState,
                    specialization: userData?.specialization,
                    institution: userData?.institution,
                    studentId: userData?.studentId,
                    gstNumber: userData?.gstNumber,
                    businessName: userData?.businessName
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching verification by ID:', error);
            return null;
        }
    }
    async getAllVerifications(filters) {
        try {
            let query = firebase_1.db.collection('verification_documents').orderBy('createdAt', 'desc');
            if (filters?.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters?.documentType) {
                query = query.where('documentType', '==', filters.documentType);
            }
            const snapshot = await query.get();
            // Manual pagination
            const total = snapshot.size;
            const start = filters?.offset || 0;
            const limit = filters?.limit || 50;
            const slicedDocs = snapshot.docs.slice(start, start + limit);
            const documents = await Promise.all(slicedDocs.map(async (doc) => {
                const data = doc.data();
                const userDoc = await firebase_1.db.collection('users').doc(data.userId).get();
                const userData = userDoc.exists ? userDoc.data() : {};
                return {
                    id: doc.id,
                    ...data,
                    user: {
                        id: data.userId,
                        name: userData?.name,
                        email: userData?.email,
                        phone: userData?.phone,
                        userType: userData?.userType,
                        licenseId: userData?.licenseId,
                        institution: userData?.institution,
                        gstNumber: userData?.gstNumber,
                        businessName: userData?.businessName
                    }
                };
            }));
            return { documents, total };
        }
        catch (error) {
            logger_1.default.error('Error fetching all verifications:', error);
            return { documents: [], total: 0 };
        }
    }
    async updateVerificationStatus(documentId, status, auditData) {
        try {
            const docRef = firebase_1.db.collection('verification_documents').doc(documentId);
            const doc = await docRef.get();
            if (!doc.exists) {
                return { success: false, error: 'Verification document not found' };
            }
            const data = doc.data();
            await docRef.update({
                status,
                reviewedBy: auditData.performedBy,
                reviewedAt: new Date().toISOString(),
                rejectionReason: auditData.rejectionReason || null
            });
            if (status === 'approved') {
                await firebase_1.db.collection('users').doc(data.userId).update({
                    isVerified: true,
                    verificationStatus: 'approved'
                });
            }
            await this.createAuditLog({
                userId: data.userId,
                action: status,
                performedBy: auditData.performedBy,
                notes: auditData.notes,
                rejectionReason: auditData.rejectionReason
            });
            const updatedDoc = await docRef.get();
            return { success: true, document: { id: updatedDoc.id, ...updatedDoc.data() } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed' };
        }
    }
    async getVerificationStats() {
        try {
            const snapshot = await firebase_1.db.collection('verification_documents').get();
            const docs = snapshot.docs.map(d => d.data());
            const total = docs.length;
            const pending = docs.filter(d => d.status === 'pending').length;
            const approved = docs.filter(d => d.status === 'approved').length;
            const rejected = docs.filter(d => d.status === 'rejected').length;
            const byType = {};
            docs.forEach(d => {
                byType[d.documentType] = (byType[d.documentType] || 0) + 1;
            });
            return { total, pending, approved, rejected, byType };
        }
        catch (error) {
            return { total: 0, pending: 0, approved: 0, rejected: 0, byType: {} };
        }
    }
    async deleteVerification(documentId, userId) {
        try {
            const docRef = firebase_1.db.collection('verification_documents').doc(documentId);
            const doc = await docRef.get();
            if (!doc.exists)
                return { success: false, error: 'Not found' };
            const data = doc.data();
            if (userId && data.userId !== userId) {
                return { success: false, error: 'Not authorized' };
            }
            // Delete file
            try {
                const filePath = path_1.default.join(process.cwd(), data.fileUrl);
                if (fs_1.default.existsSync(filePath)) {
                    await fs_1.default.promises.unlink(filePath);
                }
            }
            catch (e) {
                logger_1.default.error(e);
            }
            await docRef.delete();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
    async createAuditLog(data) {
        const log = {
            ...data,
            createdAt: new Date().toISOString()
        };
        await firebase_1.db.collection('verification_audit_logs').add(log);
        return log;
    }
    async getVerificationAuditLogs(userId) {
        const snapshot = await firebase_1.db.collection('verification_audit_logs')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    async getAllVerificationAuditLogs(filters) {
        let query = firebase_1.db.collection('verification_audit_logs').orderBy('createdAt', 'desc');
        if (filters?.action)
            query = query.where('action', '==', filters.action);
        const snapshot = await query.get();
        const total = snapshot.size;
        const start = filters?.offset || 0;
        const limit = filters?.limit || 100;
        const docs = snapshot.docs.slice(start, start + limit).map(d => ({ id: d.id, ...d.data() }));
        // Mock user join
        const logs = await Promise.all(docs.map(async (log) => {
            const userDoc = await firebase_1.db.collection('users').doc(log.userId).get();
            return {
                ...log,
                user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null
            };
        }));
        return { logs, total };
    }
}
exports.VerificationService = VerificationService;
exports.default = VerificationService;
//# sourceMappingURL=verificationService.js.map