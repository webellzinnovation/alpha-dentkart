import { db, admin } from '../config/firebase'; // Firestore
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

export interface VerificationSubmissionData {
  userId: string;
  documentType: 'license' | 'certificate' | 'id_proof' | 'clinic_proof';
  file?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  additionalData?: {
    licenseId?: string;
    licenseState?: string;
    specialization?: string;
    institution?: string;
    studentId?: string;
    gstNumber?: string;
    businessName?: string;
  };
}

export interface VerificationResponse {
  success: boolean;
  document?: any;
  error?: string;
}

export interface VerificationAuditData {
  userId: string;
  action: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  performedBy: string;
  notes?: string;
  rejectionReason?: string;
}

export class VerificationService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedFileTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'verification');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private validateFileType(mimeType: string): boolean {
    return this.allowedFileTypes.includes(mimeType);
  }

  private validateFileSize(size: number): boolean {
    return size <= this.maxFileSize;
  }

  private generateUniqueFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}_${timestamp}_${random}${ext}`;
  }

  private async saveFile(file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  }): Promise<{ fileName: string; fileUrl: string }> {
    const fileName = this.generateUniqueFileName(file.originalName);
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      fileName,
      fileUrl: `/uploads/verification/${fileName}`
    };
  }

  async submitVerification(data: VerificationSubmissionData): Promise<VerificationResponse> {
    try {
      // Save file or use provided URL
      let fileName = data.fileName || '';
      let fileUrl = data.fileUrl || '';
      let fileSize = data.fileSize || 0;
      let mimeType = data.mimeType || '';

      if (data.file) {
        // Validate file if provided as buffer
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

        const savedFile = await this.saveFile(data.file);
        fileName = savedFile.fileName;
        fileUrl = savedFile.fileUrl;
        fileSize = data.file.size;
        mimeType = data.file.mimeType;
      }

      if (!fileUrl) {
        return {
          success: false,
          error: 'No file or file URL provided'
        };
      }

      // Create doc
      const verificationData = {
        userId: data.userId,
        documentType: data.documentType,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('verification_documents').add(verificationData);

      // Update user with additional data
      const updateData: any = {};
      if (data.additionalData?.licenseId) updateData.licenseId = data.additionalData.licenseId;
      if (data.additionalData?.licenseState) updateData.licenseState = data.additionalData.licenseState;
      if (data.additionalData?.specialization) updateData.specialization = data.additionalData.specialization;
      if (data.additionalData?.institution) updateData.institution = data.additionalData.institution;
      if (data.additionalData?.studentId) updateData.studentId = data.additionalData.studentId;
      if (data.additionalData?.gstNumber) updateData.gstNumber = data.additionalData.gstNumber;
      if (data.additionalData?.businessName) updateData.businessName = data.additionalData.businessName;

      if (Object.keys(updateData).length > 0) {
        await db.collection('users').doc(data.userId).set(updateData, { merge: true });
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
    } catch (error) {
      logger.error('Error submitting verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit verification'
      };
    }
  }

  async getVerificationDocuments(userId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('verification_documents')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      // Mock join with user if needed, but here we just return docs usually
      // For consistency with Prisma include:
      const userDoc = await db.collection('users').doc(userId).get();
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
    } catch (error) {
      logger.error('Error fetching verification documents:', error);
      return [];
    }
  }

  async getVerificationById(documentId: string): Promise<any | null> {
    try {
      const doc = await db.collection('verification_documents').doc(documentId).get();
      if (!doc.exists) return null;

      const data = doc.data() as any;
      const userDoc = await db.collection('users').doc(data.userId).get();
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
    } catch (error) {
      logger.error('Error fetching verification by ID:', error);
      return null;
    }
  }

  async getAllVerifications(filters?: {
    status?: string;
    documentType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ documents: any[]; total: number }> {
    try {
      let query = db.collection('verification_documents').orderBy('createdAt', 'desc');

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

      const documents = await Promise.all(slicedDocs.map(async doc => {
        const data = doc.data();
        const userDoc = await db.collection('users').doc(data.userId).get();
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
    } catch (error) {
      logger.error('Error fetching all verifications:', error);
      return { documents: [], total: 0 };
    }
  }

  async updateVerificationStatus(
    documentId: string,
    status: 'approved' | 'rejected',
    auditData: Omit<VerificationAuditData, 'action'>
  ): Promise<VerificationResponse> {
    try {
      const docRef = db.collection('verification_documents').doc(documentId);
      const doc = await docRef.get();
      if (!doc.exists) {
        return { success: false, error: 'Verification document not found' };
      }
      const data = doc.data() as any;

      await docRef.update({
        status,
        reviewedBy: auditData.performedBy,
        reviewedAt: new Date().toISOString(),
        rejectionReason: auditData.rejectionReason || null
      });

      if (status === 'approved') {
        await db.collection('users').doc(data.userId).update({
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

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  }

  async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
  }> {
    try {
      const snapshot = await db.collection('verification_documents').get();
      const docs = snapshot.docs.map(d => d.data());

      const total = docs.length;
      const pending = docs.filter(d => d.status === 'pending').length;
      const approved = docs.filter(d => d.status === 'approved').length;
      const rejected = docs.filter(d => d.status === 'rejected').length;

      const byType: Record<string, number> = {};
      docs.forEach(d => {
        byType[d.documentType] = (byType[d.documentType] || 0) + 1;
      });

      return { total, pending, approved, rejected, byType };
    } catch (error) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, byType: {} };
    }
  }

  async deleteVerification(documentId: string, userId?: string): Promise<VerificationResponse> {
    try {
      const docRef = db.collection('verification_documents').doc(documentId);
      const doc = await docRef.get();

      if (!doc.exists) return { success: false, error: 'Not found' };
      const data = doc.data() as any;

      if (userId && data.userId !== userId) {
        return { success: false, error: 'Not authorized' };
      }

      // Delete file
      try {
        const filePath = path.join(process.cwd(), data.fileUrl);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (e) {
        logger.error(e);
      }

      await docRef.delete();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed' };
    }
  }

  private async createAuditLog(data: VerificationAuditData): Promise<any> {
    const log = {
      ...data,
      createdAt: new Date().toISOString()
    };
    await db.collection('verification_audit_logs').add(log);
    return log;
  }

  async getVerificationAuditLogs(userId: string): Promise<any[]> {
    const snapshot = await db.collection('verification_audit_logs')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getAllVerificationAuditLogs(filters?: {
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    let query = db.collection('verification_audit_logs').orderBy('createdAt', 'desc');
    if (filters?.action) query = query.where('action', '==', filters.action);

    const snapshot = await query.get();
    const total = snapshot.size;
    const start = filters?.offset || 0;
    const limit = filters?.limit || 100;

    const docs = snapshot.docs.slice(start, start + limit).map(d => ({ id: d.id, ...d.data() }));

    // Mock user join
    const logs = await Promise.all(docs.map(async (log: any) => {
      const userDoc = await db.collection('users').doc(log.userId).get();
      return {
        ...log,
        user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null
      };
    }));

    return { logs, total };
  }
}

export default VerificationService;