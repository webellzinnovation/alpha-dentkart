import { useState, useCallback } from 'react';

interface VerificationSubmissionData {
  documentType: 'license' | 'certificate' | 'id_proof' | 'clinic_proof';
  file: File;
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

interface VerificationResponse {
  success: boolean;
  document?: any;
  error?: string;
}

interface VerificationsResponse {
  success: boolean;
  documents?: any[];
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

export interface VerificationHook {
  isLoading: boolean;
  error: string | null;
  submitVerification: (data: VerificationSubmissionData) => Promise<VerificationResponse>;
  getUserVerifications: () => Promise<VerificationsResponse>;
  deleteVerification: (documentId: string) => Promise<DeleteResponse>;
  clearError: () => void;
}

export const useVerification = (): VerificationHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitVerification = useCallback(async (data: VerificationSubmissionData): Promise<VerificationResponse> => {
    return handleApiCall(async () => {
      const formData = new FormData();
      formData.append('documentType', data.documentType);
      formData.append('document', data.file);

      // Add additional data
      if (data.additionalData) {
        Object.entries(data.additionalData).forEach(([key, value]) => {
          if (value) {
            formData.append(key, value);
          }
        });
      }

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit verification');
      }

      return result;
    });
  }, [handleApiCall]);

  const getUserVerifications = useCallback(async (): Promise<VerificationsResponse> => {
    return handleApiCall(async () => {
      const response = await fetch('/api/verification/my-verifications', {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch verifications');
      }

      return result;
    });
  }, [handleApiCall]);

  const deleteVerification = useCallback(async (documentId: string): Promise<DeleteResponse> => {
    return handleApiCall(async () => {
      const response = await fetch(`/api/verification/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete verification');
      }

      return result;
    });
  }, [handleApiCall]);

  return {
    isLoading,
    error,
    submitVerification,
    getUserVerifications,
    deleteVerification,
    clearError
  };
};

export default useVerification;