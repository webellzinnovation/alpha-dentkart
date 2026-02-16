import React, { useState, useEffect } from 'react';
import { useVerification } from '../hooks/useVerification';

interface VerificationManagerProps {
  userId: string;
  isVerified?: boolean;
  userType?: string;
}

export const VerificationManager: React.FC<VerificationManagerProps> = ({
  userId,
  isVerified = false,
  userType = 'regular'
}) => {
  const {
    submitVerification,
    getUserVerifications,
    deleteVerification,
    isLoading,
    error,
    clearError
  } = useVerification();

  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'license' | 'certificate' | 'id_proof' | 'clinic_proof'>('license');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    licenseId: '',
    licenseState: '',
    specialization: '',
    institution: '',
    studentId: '',
    gstNumber: '',
    businessName: ''
  });

  useEffect(() => {
    loadUserVerifications();
  }, []);

  const loadUserVerifications = async () => {
    try {
      const result = await getUserVerifications();
      if (result.success) {
        setVerifications(result.documents);
      } else {
        console.error('Failed to load verifications:', result.error);
      }
    } catch (err) {
      console.error('Error loading verifications:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload JPEG, PNG, or PDF files only.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const result = await submitVerification({
        documentType,
        file: selectedFile,
        additionalData: {
          licenseId: formData.licenseId,
          licenseState: formData.licenseState,
          specialization: formData.specialization,
          institution: formData.institution,
          studentId: formData.studentId,
          gstNumber: formData.gstNumber,
          businessName: formData.businessName
        }
      });

      if (result.success) {
        alert('Verification submitted successfully!');
        setShowUploadForm(false);
        setSelectedFile(null);
        setFormData({
          licenseId: '',
          licenseState: '',
          specialization: '',
          institution: '',
          studentId: '',
          gstNumber: '',
          businessName: ''
        });
        loadUserVerifications();
      } else {
        alert(`Failed to submit verification: ${result.error}`);
      }
    } catch (err) {
      console.error('Error submitting verification:', err);
      alert('Failed to submit verification. Please try again.');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this verification document?')) {
      return;
    }

    try {
      const result = await deleteVerification(documentId);
      if (result.success) {
        alert('Verification deleted successfully');
        loadUserVerifications();
      } else {
        alert(`Failed to delete verification: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting verification:', err);
      alert('Failed to delete verification. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'license': return 'Professional License';
      case 'certificate': return 'Certificate';
      case 'id_proof': return 'ID Proof';
      case 'clinic_proof': return 'Clinic Proof';
      default: return type;
    }
  };

  const getRequiredDocuments = () => {
    switch (userType) {
      case 'dental-doctor':
        return ['license', 'id_proof', 'clinic_proof'];
      case 'student':
        return ['certificate', 'id_proof'];
      case 'supplier':
        return ['certificate', 'id_proof', 'gst_certificate'];
      default:
        return ['id_proof'];
    }
  };

  if (isVerified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-green-800">Verification Complete</h3>
              <p className="mt-1 text-sm text-green-600">
                Your professional account has been verified. You now have access to all professional features and benefits.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Professional Verification</h2>
          <p className="text-gray-600 mt-1">
            Upload your professional documents to verify your account and unlock professional benefits.
          </p>
        </div>

        <div className="p-6">
          {/* Verification Status */}
          {verifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Your Verification Documents</h3>
              <div className="space-y-3">
                {verifications.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">{getDocumentTypeLabel(doc.documentType)}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        {doc.fileName && (
                          <p className="text-sm text-gray-500">
                            File: {doc.fileName}
                          </p>
                        )}
                        {doc.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {doc.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      {doc.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Form */}
          {!showUploadForm ? (
            <div className="text-center">
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                Upload New Document
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Upload Verification Document</h3>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Document Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="license">Professional License</option>
                    <option value="certificate">Certificate</option>
                    <option value="id_proof">ID Proof</option>
                    <option value="clinic_proof">Clinic Proof</option>
                  </select>
                </div>

                {/* Additional Fields Based on Document Type */}
                {documentType === 'license' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={formData.licenseId}
                        onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter license number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License State
                      </label>
                      <input
                        type="text"
                        value={formData.licenseState}
                        onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter license state"
                      />
                    </div>
                  </div>
                )}

                {documentType === 'license' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Orthodontics, Pediatric Dentistry"
                    />
                  </div>
                )}

                {documentType === 'certificate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter institution name"
                    />
                  </div>
                )}

                {documentType === 'certificate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student ID"
                    />
                  </div>
                )}

                {documentType === 'clinic_proof' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter business/clinic name"
                    />
                  </div>
                )}

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: JPG, PNG, PDF, DOC, DOCX. Maximum file size: 10MB
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading || !selectedFile}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Verification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setSelectedFile(null);
                      clearError();
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationManager;