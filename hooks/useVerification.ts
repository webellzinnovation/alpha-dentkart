import { useState, useEffect } from 'react';
import { User } from '../types';

interface VerificationDocument {
  id: string;
  documentType: 'license' | 'certificate' | 'id_proof' | 'clinic_proof';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

interface VerificationHook {
  documents: VerificationDocument[];
  isUploading: boolean;
  uploadError: string | null;
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, documentType: VerificationDocument['documentType']) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  deleteVerification: (documentId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  getUserVerifications: () => Promise<VerificationDocument[]>;
  submitVerification: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useVerification = (userId: string): VerificationHook => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch verification documents
  const refreshDocuments = async () => {
    try {
      const response = await fetch(`/api/verification/documents/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch verification documents');
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching verification documents:', error);
    }
  };

  // Upload document
  const uploadDocument = async (file: File, documentType: VerificationDocument['documentType']) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        throw new Error('Only JPEG, PNG, and PDF files are allowed');
      }

      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('userId', userId);

      const response = await fetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Add to documents list
      setDocuments(prev => [...prev, result.document]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/verification/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // Load documents on mount
  useEffect(() => {
    if (userId) {
      refreshDocuments();
    }
  }, [userId]);

  // Submit verification with form data
  const submitVerification = async (data: any) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      await refreshDocuments();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Get user verifications
  const getUserVerifications = async () => {
    return documents;
  };

  // Clear error
  const clearError = () => {
    setUploadError(null);
  };

  return {
    documents,
    isUploading,
    uploadError,
    isLoading: isUploading,
    error: uploadError,
    uploadDocument,
    deleteDocument,
    deleteVerification: deleteDocument,
    refreshDocuments,
    getUserVerifications,
    submitVerification,
    clearError
  };
};