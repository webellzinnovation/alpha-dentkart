import React, { useState } from 'react';
import { User, Address, Order } from '../types';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService';
import { toast } from 'sonner';

interface CustomerManagementProps {
    users: User[];
    onUpdateUser: (uid: string, data: Partial<User>) => Promise<void>;
    onDeleteUser: (uid: string) => Promise<void>;
    onResetPassword?: (email: string) => Promise<void>;
    searchTerm: string;
    userTypeFilter: 'all' | 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular' | 'hidden';
    onViewOrder?: (order: Order) => void;
    settings?: any; // SMTP and other settings from admin
    itemsPerPage?: number;
    // External pagination props for server-side loading
    externalCurrentPage?: number;
    externalTotalItems?: number;
    onPageChange?: (page: number) => void;
    isLoading?: boolean;
}


export const CustomerManagement: React.FC<CustomerManagementProps> = ({
    users,
    onUpdateUser,
    onDeleteUser,
    onResetPassword,
    searchTerm,
    userTypeFilter,
    onViewOrder,
    settings,
    itemsPerPage,
    externalCurrentPage,
    externalTotalItems,
    onPageChange,
    isLoading
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const effectiveItemsPerPage = itemsPerPage || 10;

    // Filter customers
    const filteredCustomers = users.filter(user => {
        const hasMobile = !!(user.phone && String(user.phone).trim());

        const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (user.phone && String(user.phone).includes(searchTerm) || false);

        // Default to 'regular' if userType is not set
        const userType = user.userType || 'regular';

        if (userTypeFilter === 'hidden') {
            // Show only users without a mobile number
            return matchesSearch && !hasMobile;
        } else {
            // Show users with a mobile number and matching selected type filter
            const matchesType = userTypeFilter === 'all' || userType === userTypeFilter;
            return matchesSearch && hasMobile && matchesType;
        }
    });

    const isExternalPagination = externalCurrentPage !== undefined;
    const totalPages = isExternalPagination 
        ? Math.ceil((externalTotalItems || 0) / effectiveItemsPerPage)
        : Math.ceil(filteredCustomers.length / effectiveItemsPerPage);
    
    const currentCustomers = isExternalPagination
        ? filteredCustomers // When external, filteredCustomers already represents the current page from server
        : filteredCustomers.slice(
            (currentPage - 1) * effectiveItemsPerPage,
            currentPage * effectiveItemsPerPage
        );
    
    const displayCurrentPage = isExternalPagination ? externalCurrentPage : currentPage;
    const displayTotalItems = isExternalPagination ? externalTotalItems : filteredCustomers.length;

    // Reset to page 1 when filters change
    React.useEffect(() => {
        if (!isExternalPagination) {
            setCurrentPage(1);
        }
    }, [searchTerm, userTypeFilter, isExternalPagination]);

    // User type badge colors
    const getUserTypeBadge = (userType: User['userType']) => {
        const badges = {
            'dental-doctor': { label: 'Dental Doctor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            'dental-student': { label: 'Student', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
            'dental-business': { label: 'Business / Clinic', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
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
            onUpdateUser(selectedCustomer.email, editFormData);
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
            toast.warning('Cannot delete the last address. Customer must have at least one address.');
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
            <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Loading State Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Updating customers...</span>
                        </div>
                    </div>
                )}
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
                            {currentCustomers.map((user, index) => {
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
                                                                toast.error('SMTP settings not configured. Please configure email settings in Admin > Settings > Email tab.');
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
                                                                    toast.success(result.message);
                                                                } else {
                                                                    toast.error(result.message);
                                                                }
                                                            } catch (error) {
                                                                console.error('Error:', error);
                                                                toast.error('Failed to send verification email. Please try again.');
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

                                                <button
                                                    onClick={async () => {
                                                        if (onResetPassword) {
                                                            await onResetPassword(user.email);
                                                            return;
                                                        }

                                                        if (!settings?.email) {
                                                            toast.error('SMTP settings not configured. Please configure email settings in Admin > Settings > Email tab.');
                                                            return;
                                                        }

                                                        toast('Send Password Reset?', {
                                                            description: `Send password reset email to ${user.name} (${user.email})?`,
                                                            action: {
                                                                label: 'Send',
                                                                onClick: async () => {
                                                                    setSendingPasswordResetTo(user.email);
                                                                    try {
                                                                        const result = await sendPasswordResetEmail(
                                                                            user.email,
                                                                            user.name,
                                                                            settings.email
                                                                        );

                                                                        if (result.success) {
                                                                            toast.success(result.message);
                                                                        } else {
                                                                            toast.error('Failed to send password reset email: ' + result.message);
                                                                        }
                                                                    } catch (error: any) {
                                                                        toast.error(`Error: ${error.message || 'Failed to send password reset email'}`);
                                                                    } finally {
                                                                        setSendingPasswordResetTo(null);
                                                                    }
                                                                }
                                                            }
                                                        });
                                                        return;
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
                            {/* ... Content of Edit Modal ... */}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        {/* ... Content of Delete Modal ... */}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {(isExternalPagination ? (externalTotalItems || 0) : filteredCustomers.length) > effectiveItemsPerPage && (
                <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-4">
                    <span className="text-sm text-gray-500">
                        Showing {((displayCurrentPage || 1) - 1) * effectiveItemsPerPage + 1} to {Math.min((displayCurrentPage || 1) * effectiveItemsPerPage, displayTotalItems || 0)} of {displayTotalItems} customers
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={(displayCurrentPage || 1) === 1 || isLoading} 
                            onClick={() => isExternalPagination ? onPageChange?.((displayCurrentPage || 1) - 1) : setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if ((displayCurrentPage || 1) <= 3) {
                                pageNum = i + 1;
                            } else if ((displayCurrentPage || 1) >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = (displayCurrentPage || 1) - 2 + i;
                            }
                            
                            if (pageNum < 1 || pageNum > totalPages) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => isExternalPagination ? onPageChange?.(pageNum) : setCurrentPage(pageNum)}
                                    disabled={isLoading}
                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                        (displayCurrentPage || 1) === pageNum 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            disabled={(displayCurrentPage || 1) === totalPages || isLoading} 
                            onClick={() => isExternalPagination ? onPageChange?.((displayCurrentPage || 1) + 1) : setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
