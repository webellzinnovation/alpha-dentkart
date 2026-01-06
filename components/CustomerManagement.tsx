// Enhanced Customer Management Component for AdminDashboard
// This component displays all customer information from WordPress with full edit capabilities

import React, { useState } from 'react';
import { User, Address, Order } from '../types';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService';

interface CustomerManagementProps {
    users: User[];
    onUpdateUser: (userId: number, updates: Partial<User>) => void;
    onDeleteUser?: (userEmail: string) => void;
    searchTerm: string;
    userTypeFilter: 'all' | 'dental-doctor' | 'student' | 'supplier' | 'regular';
    onViewOrder?: (order: Order) => void;
    settings?: any; // SMTP and other settings from admin
}


export const CustomerManagement: React.FC<CustomerManagementProps> = ({
    users,
    onUpdateUser,
    onDeleteUser,
    searchTerm,
    userTypeFilter,
    onViewOrder,
    settings
}) => {
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});

    // Address editing state
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [addressFormData, setAddressFormData] = useState<Address | null>(null);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null);
    const [sendingPasswordResetTo, setSendingPasswordResetTo] = useState<string | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
    const [deleteNameInput, setDeleteNameInput] = useState('');

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
        // Reset address editing state
        setEditingAddressId(null);
        setAddressFormData(null);
        setIsAddingNewAddress(false);
    };

    // Address CRUD handlers
    const handleEditAddress = (address: Address) => {
        setEditingAddressId(address.id);
        setAddressFormData({ ...address });
        setIsAddingNewAddress(false);
    };

    const handleAddNewAddress = () => {
        const newId = Math.max(0, ...(editFormData.addresses || []).map(a => a.id)) + 1;
        setAddressFormData({
            id: newId,
            type: 'Home',
            name: editFormData.name || '',
            street: '',
            city: '',
            state: '',
            zip: '',
            phone: editFormData.phone || '',
            isDefault: (editFormData.addresses || []).length === 0
        });
        setIsAddingNewAddress(true);
        setEditingAddressId(null);
    };

    const handleSaveAddress = () => {
        if (!addressFormData) return;

        const currentAddresses = editFormData.addresses || [];
        let updatedAddresses: Address[];

        if (isAddingNewAddress) {
            // Adding new address
            updatedAddresses = [...currentAddresses, addressFormData];
        } else {
            // Updating existing address
            updatedAddresses = currentAddresses.map(addr =>
                addr.id === addressFormData.id ? addressFormData : addr
            );
        }

        setEditFormData({ ...editFormData, addresses: updatedAddresses });
        setEditingAddressId(null);
        setAddressFormData(null);
        setIsAddingNewAddress(false);
    };

    const handleCancelAddressEdit = () => {
        setEditingAddressId(null);
        setAddressFormData(null);
        setIsAddingNewAddress(false);
    };

    const handleDeleteAddress = (addressId: number) => {
        const currentAddresses = editFormData.addresses || [];

        // Prevent deleting the last address
        if (currentAddresses.length <= 1) {
            alert('Cannot delete the last address. Customer must have at least one address.');
            return;
        }

        const addressToDelete = currentAddresses.find(a => a.id === addressId);

        // If deleting default address, set another as default
        let updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);
        if (addressToDelete?.isDefault && updatedAddresses.length > 0) {
            updatedAddresses[0].isDefault = true;
        }

        setEditFormData({ ...editFormData, addresses: updatedAddresses });
        setEditingAddressId(null);
        setAddressFormData(null);
    };

    const handleSetDefaultAddress = (addressId: number) => {
        const currentAddresses = editFormData.addresses || [];
        const updatedAddresses = currentAddresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        }));
        setEditFormData({ ...editFormData, addresses: updatedAddresses });
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
                                                {!isVerified && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!settings?.email) {
                                                                alert('SMTP settings not configured. Please configure email settings in Admin > Settings > Email tab.');
                                                                return;
                                                            }

                                                            setSendingEmailTo(user.email);
                                                            try {
                                                                const result = await sendVerificationEmail(
                                                                    {
                                                                        to: user.email,
                                                                        customerName: user.name,
                                                                        verificationLink: '' // Will be generated in the function
                                                                    },
                                                                    settings.email
                                                                );

                                                                if (result.success) {
                                                                    alert(`✅ ${result.message}\n\nThe customer will receive an email with a verification link.`);
                                                                } else {
                                                                    alert(`❌ ${result.message}\n\nPlease check your SMTP settings and try again.`);
                                                                }
                                                            } catch (error) {
                                                                console.error('Error:', error);
                                                                alert('Failed to send verification email. Please try again.');
                                                            } finally {
                                                                setSendingEmailTo(null);
                                                            }
                                                        }}
                                                        disabled={sendingEmailTo === user.email}
                                                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all shadow-sm ${sendingEmailTo === user.email
                                                            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'border-blue-200 dark:border-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-600 dark:text-blue-400'
                                                            }`}
                                                        title="Send Verification Email"
                                                    >
                                                        {sendingEmailTo === user.email ? (
                                                            <i className="fas fa-spinner fa-spin text-xs"></i>
                                                        ) : (
                                                            <i className="fas fa-envelope text-xs"></i>
                                                        )}
                                                    </button>
                                                )}

                                                {/* Send Password Reset Button */}
                                                <button
                                                    onClick={async () => {
                                                        if (!settings?.email) {
                                                            alert('SMTP settings not configured. Please configure email settings in Admin > Settings > Email tab.');
                                                            return;
                                                        }

                                                        if (!confirm(`Send password reset email to ${user.name} (${user.email})?`)) {
                                                            return;
                                                        }

                                                        setSendingPasswordResetTo(user.email);
                                                        try {
                                                            const result = await sendPasswordResetEmail(
                                                                user.email,
                                                                user.name,
                                                                settings.email
                                                            );

                                                            if (result.success) {
                                                                alert(`✅ ${result.message}\n\nThe customer will receive an email with a password reset link.`);
                                                            } else {
                                                                alert(`❌ Failed to send password reset email\n\n${result.message}`);
                                                            }
                                                        } catch (error: any) {
                                                            alert(`❌ Error: ${error.message || 'Failed to send password reset email'}`);
                                                        } finally {
                                                            setSendingPasswordResetTo(null);
                                                        }
                                                    }}
                                                    disabled={sendingPasswordResetTo === user.email}
                                                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all shadow-sm ${sendingPasswordResetTo === user.email
                                                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'border-amber-200 dark:border-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-amber-600 dark:text-amber-400'
                                                        }`}
                                                    title="Send Password Reset Email"
                                                >
                                                    {sendingPasswordResetTo === user.email ? (
                                                        <i className="fas fa-spinner fa-spin text-xs"></i>
                                                    ) : (
                                                        <i className="fas fa-key text-xs"></i>
                                                    )}
                                                </button>

                                                {/* Delete Customer Button */}
                                                {onDeleteUser && (
                                                    <button
                                                        onClick={() => {
                                                            setUserToDelete(user);
                                                            setDeleteConfirmStep(1);
                                                            setDeleteNameInput('');
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 text-red-600 dark:text-red-400 flex items-center justify-center transition-all shadow-sm"
                                                        title="Delete Customer"
                                                    >
                                                        <i className="fas fa-trash text-xs"></i>
                                                    </button>
                                                )}
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

                            {/* Addresses Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Addresses</h4>
                                    {!isAddingNewAddress && !editingAddressId && (
                                        <button
                                            onClick={handleAddNewAddress}
                                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <i className="fas fa-plus mr-1"></i>
                                            Add Address
                                        </button>
                                    )}
                                </div>

                                {/* Add New Address Form */}
                                {isAddingNewAddress && addressFormData && (
                                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                                        <h5 className="font-bold text-gray-900 dark:text-white mb-3">New Address</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={addressFormData.name}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <select
                                                value={addressFormData.type}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, type: e.target.value as 'Home' | 'Clinic' | 'Office' })}
                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            >
                                                <option value="Home">Home</option>
                                                <option value="Clinic">Clinic</option>
                                                <option value="Office">Office</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Phone"
                                                value={addressFormData.phone}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Street Address"
                                                value={addressFormData.street}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={addressFormData.city}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={addressFormData.state}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                            <input
                                                type="text"
                                                placeholder="ZIP Code"
                                                value={addressFormData.zip}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, zip: e.target.value })}
                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={handleSaveAddress}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                            >
                                                <i className="fas fa-check mr-1"></i>
                                                Save Address
                                            </button>
                                            <button
                                                onClick={handleCancelAddressEdit}
                                                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                                            >
                                                <i className="fas fa-times mr-1"></i>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Addresses */}
                                {editFormData.addresses && editFormData.addresses.length > 0 ? (
                                    <div className="space-y-3">
                                        {editFormData.addresses.map((address) => (
                                            <div key={address.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                {editingAddressId === address.id && addressFormData ? (
                                                    // Edit Mode
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 dark:text-white mb-3">Edit Address</h5>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Name"
                                                                value={addressFormData.name}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                            <select
                                                                value={addressFormData.type}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, type: e.target.value as 'Home' | 'Clinic' | 'Office' })}
                                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="Home">Home</option>
                                                                <option value="Clinic">Clinic</option>
                                                                <option value="Office">Office</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                placeholder="Phone"
                                                                value={addressFormData.phone}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Street Address"
                                                                value={addressFormData.street}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="City"
                                                                value={addressFormData.city}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="State"
                                                                value={addressFormData.state}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                                                className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="ZIP Code"
                                                                value={addressFormData.zip}
                                                                onChange={(e) => setAddressFormData({ ...addressFormData, zip: e.target.value })}
                                                                className="col-span-2 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={handleSaveAddress}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                            >
                                                                <i className="fas fa-check mr-1"></i>
                                                                Save Changes
                                                            </button>
                                                            <button
                                                                onClick={handleCancelAddressEdit}
                                                                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                                                            >
                                                                <i className="fas fa-times mr-1"></i>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View Mode
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900 dark:text-white">
                                                                    {address.type === 'Home' ? '🏠' : address.type === 'Clinic' ? '🏥' : '🏢'} {address.type} Address
                                                                </span>
                                                                {address.isDefault && (
                                                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!isAddingNewAddress && !editingAddressId && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleEditAddress(address)}
                                                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                                                                        title="Edit"
                                                                    >
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    {!address.isDefault && (
                                                                        <button
                                                                            onClick={() => handleSetDefaultAddress(address.id)}
                                                                            className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm"
                                                                            title="Set as Default"
                                                                        >
                                                                            <i className="fas fa-star"></i>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteAddress(address.id)}
                                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
                                                                        title="Delete"
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                            <p className="font-medium text-gray-900 dark:text-white">{address.name}</p>
                                                            <p>{address.street}</p>
                                                            <p>{address.city}, {address.state} - {address.zip}</p>
                                                            {address.phone && <p>📞 {address.phone}</p>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : !isAddingNewAddress ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <i className="fas fa-map-marker-alt text-3xl mb-2"></i>
                                        <p>No addresses added yet</p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Order History Section */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order History</h4>
                                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedCustomer.orders.slice(0, 5).map((order, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            Order #{order.id}
                                                        </span>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(order.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900 dark:text-white">
                                                            ₹{order.total.toLocaleString('en-IN')}
                                                        </p>
                                                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            order.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                order.status === 'Shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                    </div>
                                                    {onViewOrder && (
                                                        <button
                                                            onClick={() => onViewOrder(order)}
                                                            className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <i className="fas fa-eye mr-1"></i>
                                                            View Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {selectedCustomer.orders.length > 5 && (
                                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                                                Showing 5 of {selectedCustomer.orders.length} orders
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <i className="fas fa-shopping-bag text-3xl mb-2"></i>
                                        <p>No orders yet</p>
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

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <i className="fas fa-exclamation-triangle text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Delete Customer</h3>
                                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {deleteConfirmStep === 1 ? (
                                <>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{userToDelete.name}</strong>?
                                    </p>
                                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded mb-6">
                                        <div className="flex gap-3">
                                            <i className="fas fa-info-circle text-red-600 dark:text-red-400 mt-0.5"></i>
                                            <div className="text-sm text-red-800 dark:text-red-300">
                                                <p className="font-semibold mb-1">Warning:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>All customer data will be permanently deleted</li>
                                                    <li>Order history will be removed</li>
                                                    <li>This action cannot be reversed</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                                                {userToDelete.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{userToDelete.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{userToDelete.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            <i className="fas fa-shopping-bag mr-1"></i>
                                            {userToDelete.orders?.length || 0} orders
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setDeleteModalOpen(false);
                                                setUserToDelete(null);
                                                setDeleteConfirmStep(1);
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmStep(2)}
                                            className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/30"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        To confirm deletion, please type the customer's name:
                                    </p>
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4 text-center">
                                        <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                                            {userToDelete.name}
                                        </span>
                                    </div>

                                    <input
                                        type="text"
                                        value={deleteNameInput}
                                        onChange={(e) => setDeleteNameInput(e.target.value)}
                                        placeholder="Type customer name here"
                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all mb-6"
                                        autoFocus
                                    />

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmStep(1);
                                                setDeleteNameInput('');
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-all"
                                        >
                                            <i className="fas fa-arrow-left mr-2"></i>
                                            Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (deleteNameInput === userToDelete.name) {
                                                    onDeleteUser?.(userToDelete.email);
                                                    setDeleteModalOpen(false);
                                                    setUserToDelete(null);
                                                    setDeleteConfirmStep(1);
                                                    setDeleteNameInput('');
                                                } else {
                                                    // Show error - name doesn't match
                                                    alert('❌ The name you entered does not match. Please try again.');
                                                }
                                            }}
                                            disabled={deleteNameInput !== userToDelete.name}
                                            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${deleteNameInput === userToDelete.name
                                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <i className="fas fa-trash mr-2"></i>
                                            Delete Customer
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
