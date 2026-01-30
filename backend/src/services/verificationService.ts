import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export interface VerificationSubmissionData {
  userId: string;
  documentType: 'license' | 'certificate' | 'id_proof' | 'clinic_proof';
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
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
  private prisma: PrismaClient;
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

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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

      // Check if user already has a pending verification of this type
      const existingVerification = await this.prisma.verificationDocument.findFirst({
        where: {
          userId: data.userId,
          documentType: data.documentType,
          status: {
            in: ['pending']
          }
        }
      });

      if (existingVerification) {
        return {
          success: false,
          error: `You already have a ${data.documentType.replace('_', ' ')} verification under review. Please wait for the current verification to be completed.`
        };
      }

      // Save file
      const savedFile = await this.saveFile(data.file);

      // Create verification document
      const verificationDocument = await this.prisma.verificationDocument.create({
        data: {
          userId: data.userId,
          documentType: data.documentType,
          fileName: savedFile.fileName,
          fileUrl: savedFile.fileUrl,
          fileSize: data.file.size,
          mimeType: data.file.mimeType,
          status: 'pending',
          createdAt: new Date()
        }
      });

      // Update user's additional verification data
      const updateData: any = {};
      if (data.additionalData?.licenseId) updateData.licenseId = data.additionalData.licenseId;
      if (data.additionalData?.licenseState) updateData.licenseState = data.additionalData.licenseState;
      if (data.additionalData?.specialization) updateData.specialization = data.additionalData.specialization;
      if (data.additionalData?.institution) updateData.institution = data.additionalData.institution;
      if (data.additionalData?.studentId) updateData.studentId = data.additionalData.studentId;
      if (data.additionalData?.gstNumber) updateData.gstNumber = data.additionalData.gstNumber;
      if (data.additionalData?.businessName) updateData.businessName = data.additionalData.businessName;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.user.update({
          where: { id: data.userId },
          data: updateData
        });
      }

      // Create audit log
      await this.createAuditLog({
        userId: data.userId,
        action: 'submitted',
        performedBy: data.userId,
        notes: `${data.documentType} verification submitted`
      });

      return {
        success: true,
        document: verificationDocument
      };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit verification'
      };
    }
  }

  async getVerificationDocuments(userId: string): Promise<any[]> {
    try {
      return await this.prisma.verificationDocument.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching verification documents:', error);
      return [];
    }
  }

  async getVerificationById(documentId: string): Promise<any | null> {
    try {
      return await this.prisma.verificationDocument.findUnique({
        where: { id: documentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              userType: true,
              licenseId: true,
              licenseState: true,
              specialization: true,
              institution: true,
              studentId: true,
              gstNumber: true,
              businessName: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching verification by ID:', error);
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
      const where: any = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.documentType) {
        where.documentType = filters.documentType;
      }

      const [documents, total] = await Promise.all([
        this.prisma.verificationDocument.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                userType: true,
                licenseId: true,
                institution: true,
                gstNumber: true,
                businessName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0
        }),
        this.prisma.verificationDocument.count({ where })
      ]);

      return { documents, total };
    } catch (error) {
      console.error('Error fetching all verifications:', error);
      return { documents: [], total: 0 };
    }
  }

  async updateVerificationStatus(
    documentId: string,
    status: 'approved' | 'rejected',
    auditData: Omit<VerificationAuditData, 'action'>
  ): Promise<VerificationResponse> {
    try {
      // Get current verification
      const currentVerification = await this.prisma.verificationDocument.findUnique({
        where: { id: documentId }
      });

      if (!currentVerification) {
        return {
          success: false,
          error: 'Verification document not found'
        };
      }

      // Update verification status
      const updatedVerification = await this.prisma.verificationDocument.update({
        where: { id: documentId },
        data: {
          status,
          reviewedBy: auditData.performedBy,
          reviewedAt: new Date(),
          rejectionReason: auditData.rejectionReason
        }
      });

      // Update user's verification status if approved
      if (status === 'approved') {
        await this.prisma.user.update({
          where: { id: currentVerification.userId },
          data: {
            isVerified: true,
            verificationStatus: 'approved'
          }
        });
      }

      // Create audit log
      await this.createAuditLog({
        userId: currentVerification.userId,
        action: status,
        performedBy: auditData.performedBy,
        notes: auditData.notes,
        rejectionReason: auditData.rejectionReason
      });

      return {
        success: true,
        document: updatedVerification
      };
    } catch (error) {
      console.error('Error updating verification status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update verification status'
      };
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
      const [stats, byType] = await Promise.all([
        this.prisma.verificationDocument.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        }),
        this.prisma.verificationDocument.groupBy({
          by: ['documentType'],
          _count: {
            documentType: true
          }
        })
      ]);

      const statusCounts = stats.reduce((acc, item) => {
        acc[item.status] = (item._count.status as number) || 0;
        return acc;
      }, {} as Record<string, number>);

      const typeCounts = byType.reduce((acc, item) => {
        acc[item.documentType] = (item._count.documentType as number) || 0;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

      return {
        total,
        pending: statusCounts['pending'] || 0,
        approved: statusCounts['approved'] || 0,
        rejected: statusCounts['rejected'] || 0,
        byType: typeCounts
      };
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byType: {}
      };
    }
  }

  async deleteVerification(documentId: string, userId?: string): Promise<VerificationResponse> {
    try {
      // Get verification document
      const verification = await this.prisma.verificationDocument.findUnique({
        where: { id: documentId }
      });

      if (!verification) {
        return {
          success: false,
          error: 'Verification document not found'
        };
      }

      // Check if user is authorized (admin or document owner)
      if (userId && verification.userId !== userId) {
        return {
          success: false,
          error: 'Not authorized to delete this verification'
        };
      }

      // Delete associated file
      try {
        const filePath = path.join(process.cwd(), verification.fileUrl);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }

      // Delete verification document
      await this.prisma.verificationDocument.delete({
        where: { id: documentId }
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete verification'
      };
    }
  }

  private async createAuditLog(data: VerificationAuditData): Promise<any> {
    return await this.prisma.verificationAudit.create({
      data: {
        userId: data.userId,
        action: data.action,
        performedBy: data.performedBy,
        notes: data.notes,
        createdAt: new Date()
      }
    });
  }

  async getVerificationAuditLogs(userId: string): Promise<any[]> {
    try {
      return await this.prisma.verificationAudit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching verification audit logs:', error);
      return [];
    }
  }

  async getAllVerificationAuditLogs(filters?: {
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {};
      
      if (filters?.action) {
        where.action = filters.action;
      }

      const [logs, total] = await Promise.all([
        this.prisma.verificationAudit.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 100,
          skip: filters?.offset || 0
        }),
        this.prisma.verificationAudit.count({ where })
      ]);

      return { logs, total };
    } catch (error) {
      console.error('Error fetching all verification audit logs:', error);
      return { logs: [], total: 0 };
    }
  }
}

export default VerificationService;