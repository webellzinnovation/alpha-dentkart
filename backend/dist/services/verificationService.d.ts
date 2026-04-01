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
export declare class VerificationService {
    private readonly uploadDir;
    private readonly maxFileSize;
    private readonly allowedFileTypes;
    constructor();
    private ensureUploadDirectory;
    private validateFileType;
    private validateFileSize;
    private generateUniqueFileName;
    private saveFile;
    submitVerification(data: VerificationSubmissionData): Promise<VerificationResponse>;
    getVerificationDocuments(userId: string): Promise<any[]>;
    getVerificationById(documentId: string): Promise<any | null>;
    getAllVerifications(filters?: {
        status?: string;
        documentType?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        documents: any[];
        total: number;
    }>;
    updateVerificationStatus(documentId: string, status: 'approved' | 'rejected', auditData: Omit<VerificationAuditData, 'action'>): Promise<VerificationResponse>;
    getVerificationStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        byType: Record<string, number>;
    }>;
    deleteVerification(documentId: string, userId?: string): Promise<VerificationResponse>;
    private createAuditLog;
    getVerificationAuditLogs(userId: string): Promise<any[]>;
    getAllVerificationAuditLogs(filters?: {
        action?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: any[];
        total: number;
    }>;
}
export default VerificationService;
//# sourceMappingURL=verificationService.d.ts.map