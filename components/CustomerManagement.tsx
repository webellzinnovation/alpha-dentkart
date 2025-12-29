// Enhanced Customer Management Component for AdminDashboard
// This component displays all customer information from WordPress with full edit capabilities

import React, { useState } from 'react';
import { User, Address } from '../types';

interface CustomerManagementProps {
    users: User[];
    onUpdateUser: (userId: number, updates: Partial<User>) => void;
    searchTerm: string;
    userTypeFilter: 'all' | 'dental-doctor' | 'student' | 'supplier' | 'regular';
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
    users,
    onUpdateUser,
    searchTerm,
    userTypeFilter
}) => {
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});

    // Filter customers
    const filteredCustomers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);

        // Default to 'regular' if userType is not set
        const userType = user.userType || 'regular';
        const matchesType = userTypeFilter === 'all' || userType === userTypeFilter;

        return matchesSearch && matchesType;
    });

    // User type badge colors
    const getUserTypeBadge = (userType: User['userType']) => {
        const badges = {
            'dental-doctor': { label: 'Dental Doctor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            'student': { label: 'Student', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
            'supplier': { label: 'Supplier', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
            'regular': { label: 'Regular', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
        };
        return badges[userType] || badges.regular;
    };

    // Verification status badge
    const getVerificationBadge = (status: User['verificationStatus']) => {
        const badges = {
            'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
            'approved': { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
            'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
        };
        return badges[status];
    };

    const handleEditCustomer = (user: User) => {
        setSelectedCustomer(user);
        setEditFormData(user);
        setIsEditModalOpen(true);
    };

    const handleSaveCustomer = () => {
        if (selectedCustomer) {
            // Find user index
            const userIndex = users.findIndex(u => u.email === selectedCustomer.email);
            if (userIndex !== -1) {
                onUpdateUser(userIndex, editFormData);
            }
        }
        setIsEditModalOpen(false);
        setSelectedCustomer(null);
    };

    return (
        <div className="space-y-6">
            {/* Customer List */}
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Verification</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {filteredCustomers.map((user, index) => {
                                // Provide defaults for new fields that might not exist on old user data
                                const userType = user.userType || 'regular';
                                const verificationStatus = user.verificationStatus || 'pending';
                                const isVerified = user.isVerified !== undefined ? user.isVerified : false;

                                const userTypeBadge = getUserTypeBadge(userType);
                                const verificationBadge = getVerificationBadge(verificationStatus);

                                return (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${userTypeBadge.color}`}>
                                                {userTypeBadge.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationBadge.color}`}>
                                                {verificationBadge.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-600 dark:text-gray-400">
                                                <div>{user.phone}</div>
                                                {user.alternatePhone && <div className="text-xs">{user.alternatePhone}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {user.orders?.length || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isVerified
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {isVerified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditCustomer(user)}
                                                    className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm"
                                                    title="Edit Customer"
                                                >
                                                    <i className="fas fa-pen text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Customer Modal */}
            {isEditModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-20">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Customer Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-red-500 shadow-sm">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editFormData.name || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editFormData.email || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={editFormData.phone || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternate Phone</label>
                                        <input
                                            type="tel"
                                            value={editFormData.alternatePhone || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editFormData.dateOfBirth || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                        <select
                                            value={editFormData.gender || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* User Type & Verification */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Type & Verification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                                        <select
                                            value={editFormData.userType || 'regular'}
                                            onChange={(e) => setEditFormData({ ...editFormData, userType: e.target.value as any })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        >
                                            <option value="regular">Regular Customer</option>
                                            <option value="dental-doctor">Dental Doctor</option>
                                            <option value="student">Student</option>
                                            <option value="supplier">Supplier</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Status</label>
                                        <select
                                            value={editFormData.verificationStatus || 'pending'}
                                            onChange={(e) => setEditFormData({ ...editFormData, verificationStatus: e.target.value as any })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Conditional fields based on user type */}
                                {editFormData.userType === 'dental-doctor' && (
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                                        <h5 className="font-bold text-blue-900 dark:text-blue-300">Dental Doctor Information</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="License ID"
                                                value={editFormData.dentalDoctorInfo?.licenseId || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    dentalDoctorInfo: { ...editFormData.dentalDoctorInfo!, licenseId: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="License State"
                                                value={editFormData.dentalDoctorInfo?.licenseState || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    dentalDoctorInfo: { ...editFormData.dentalDoctorInfo!, licenseState: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Specialization"
                                                value={editFormData.dentalDoctorInfo?.specialization || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    dentalDoctorInfo: { ...editFormData.dentalDoctorInfo!, specialization: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Clinic Name"
                                                value={editFormData.dentalDoctorInfo?.clinicName || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    dentalDoctorInfo: { ...editFormData.dentalDoctorInfo!, clinicName: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                )}

                                {editFormData.userType === 'student' && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
                                        <h5 className="font-bold text-green-900 dark:text-green-300">Student Information</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Student ID"
                                                value={editFormData.studentInfo?.studentId || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    studentInfo: { ...editFormData.studentInfo!, studentId: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Institution"
                                                value={editFormData.studentInfo?.institution || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    studentInfo: { ...editFormData.studentInfo!, institution: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Course"
                                                value={editFormData.studentInfo?.course || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    studentInfo: { ...editFormData.studentInfo!, course: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Year of Study"
                                                value={editFormData.studentInfo?.yearOfStudy || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    studentInfo: { ...editFormData.studentInfo!, yearOfStudy: parseInt(e.target.value) }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                )}

                                {editFormData.userType === 'supplier' && (
                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                                        <h5 className="font-bold text-purple-900 dark:text-purple-300">Supplier Information</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="GST Number"
                                                value={editFormData.supplierInfo?.gstNumber || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    supplierInfo: { ...editFormData.supplierInfo!, gstNumber: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Business Name"
                                                value={editFormData.supplierInfo?.businessName || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    supplierInfo: { ...editFormData.supplierInfo!, businessName: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Business Type"
                                                value={editFormData.supplierInfo?.businessType || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    supplierInfo: { ...editFormData.supplierInfo!, businessType: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="PAN Number"
                                                value={editFormData.supplierInfo?.panNumber || ''}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    supplierInfo: { ...editFormData.supplierInfo!, panNumber: e.target.value }
                                                })}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes</label>
                                <textarea
                                    rows={3}
                                    value={editFormData.notes || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                    placeholder="Internal notes about this customer..."
                                ></textarea>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCustomer}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 transition-all active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
