import { useState, useEffect } from 'react';
import { storage } from '../src/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  deleteVerification: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  refreshDocuments: () => Promise<void>;
  getUserVerifications: () => Promise<{ success: boolean; documents?: VerificationDocument[]; error?: string }>;
  submitVerification: (data: any) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useVerification = (userId?: string): VerificationHook => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch verification documents
  const refreshDocuments = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`/api/v1/verification/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch verification documents');
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching verification documents:', error);
    }
  };

  // Upload document via Firebase Storage
  const uploadDocument = async (file: File, documentType: VerificationDocument['documentType']) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      if (!userId) throw new Error('User ID not provided');

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      // 1. Upload to Firebase Storage
      const fileExtension = file.name.split('.').pop();
      const storagePath = `verifications/${userId}/${Date.now()}_${documentType}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadResult = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // 2. Submit metadata to backend
      const response = await fetch('/api/v1/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          documentType,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        }),
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
      const response = await fetch(`/api/v1/verification/documents/${documentId}`, {
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

  // Get user verifications
  const getUserVerifications = async (): Promise<{ success: boolean; documents?: VerificationDocument[]; error?: string }> => {
    try {
      const response = await fetch(`/api/v1/verification/documents`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch verification documents');
      }
      const data = await response.json();
      return { success: true, documents: data.documents || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch verifications';
      return { success: false, error: errorMessage };
    }
  };

  // Submit verification with form data and Firebase Storage upload
  const submitVerification = async (data: any): Promise<{ success: boolean; error?: string }> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const { file, documentType, additionalData } = data;
      
      if (!file) throw new Error('No file provided');
      if (!userId) throw new Error('User ID not provided');

      // 1. Upload to Firebase Storage
      const fileExtension = file.name.split('.').pop();
      const storagePath = `verifications/${userId}/${Date.now()}_${documentType}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadResult = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // 2. Submit metadata and additional data to backend
      const response = await fetch('/api/v1/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          documentType,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          ...additionalData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      await refreshDocuments();
      return { success: true };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setUploadError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  // Delete verification document
  const deleteVerification = async (documentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/v1/verification/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete verification';
      return { success: false, error: errorMessage };
    }
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
    deleteVerification,
    refreshDocuments,
    getUserVerifications,
    submitVerification,
    clearError
  };
};