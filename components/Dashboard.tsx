
import React, { useState } from 'react';
import { User, Address, Order } from '../types';
import { AlertCircle, Package, User as UserIcon, LogOut, MapPin, ChevronRight, Settings, Camera, ShieldCheck } from 'lucide-react';
import VerificationManager from './VerificationManager';
import OrderTracking from './OrderTracking';
import { InvoiceViewer } from './InvoiceViewer';
import { CancelOrderModal } from './CancelOrderModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { QuickReorder } from './QuickReorder';
import { SavedPaymentMethods } from './SavedPaymentMethods';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (data: Partial<User>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'returns' | 'addresses' | 'profile'>('overview');
    const [selectedUserType, setSelectedUserType] = useState<User['userType']>(user.userType || 'regular');

    // Address Modal State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [addressFormData, setAddressFormData] = useState<Address>({
        id: 0,
        type: 'Home',
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        isDefault: false
    });

    // Tracking Modal State
    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);

    // Invoice Modal State
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

    // Cancel Order Modal State
    const [cancelOrder, setCancelOrder] = useState<Order | null>(null);

    // Return Request Modal State
    const [returnOrder, setReturnOrder] = useState<Order | null>(null);

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const statusColors: Record<string, string> = {
        Processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Shipped: 'bg-blue-100 text-blue-700 border-blue-200',
        Delivered: 'bg-green-100 text-green-700 border-green-200',
        Cancelled: 'bg-red-100 text-red-700 border-red-200',
        Pending: 'bg-gray-100 text-gray-700 border-gray-200',
        Returned: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
        { id: 'orders', label: 'My Orders', icon: 'fas fa-box-open' },
        { id: 'returns', label: 'My Returns', icon: 'fas fa-undo' },
        { id: 'addresses', label: 'Addresses', icon: 'fas fa-map-marker-alt' },
        { id: 'profile', label: 'Profile Settings', icon: 'fas fa-user-cog' },
    ];

    // Address Handlers
    const handleAddNewAddress = () => {
        setEditingAddressIndex(null);
        setAddressFormData({
            id: Date.now(),
            type: 'Home',
            name: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            isDefault: false
        });
        setIsAddressModalOpen(true);
    };

    const handleEditAddress = (address: Address, index: number) => {
        setEditingAddressIndex(index);
        setAddressFormData({ ...address });
        setIsAddressModalOpen(true);
    };

    const handleDeleteAddress = (id: number) => {
        setDeleteConfirmation({
            isOpen: true,
            title: 'Delete Address',
            message: 'Are you sure you want to delete this address? This cannot be undone.',
            onConfirm: () => {
                const newAddresses = user.addresses.filter(a => a.id !== id);
                onUpdateUser({ addresses: newAddresses });
                setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSaveAddress = (e: React.FormEvent) => {
        e.preventDefault();

        let newAddresses = [...user.addresses];

        // If setting default, unset others
        if (addressFormData.isDefault) {
            newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
        }

        if (editingAddressIndex !== null) {
            // Update existing
            newAddresses[editingAddressIndex] = addressFormData;
        } else {
            // Add new
            newAddresses.push(addressFormData);
        }

        onUpdateUser({ addresses: newAddresses });
        setIsAddressModalOpen(false);
    };

    const OrderTracker = ({ status }: { status: string }) => {
        const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
        const stepIndex = steps.indexOf(status);
        const currentStep = stepIndex >= 0 ? stepIndex : 0;
        const isUnknown = stepIndex < 0;

        if (isUnknown) {
            return (
                <div className="py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        status === 'Failed' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {status}
                    </span>
                </div>
            );
        }

        return (
            <div className="w-full py-6">
                <div className="relative flex items-center justify-between w-full">
                    {/* Line Background */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                    {/* Active Line */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 transition-all duration-500 -z-10"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStep;
                        const isActive = idx === currentStep;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-white dark:bg-surface-dark px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                                    {isCompleted ? <i className="fas fa-check"></i> : idx + 1}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'text-green-600 font-bold' : 'text-gray-500'}`}>{step}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const latestOrder = user.orders?.[0];

    return (
        <div className="container mx-auto py-8 relative">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Sidebar */}
                <div className="w-full lg:w-1/4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center text-center bg-gradient-to-b from-primary/5 to-transparent">
                            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md mb-4 overflow-hidden">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-xl">{user.name}</h3>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                        <nav className="p-3">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <i className={`${item.icon} w-5 text-center text-lg`}></i>
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-2"
                            >
                                <i className="fas fa-sign-out-alt w-5 text-center text-lg"></i>
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                                    <i className="fas fa-tooth text-[12rem] absolute -right-10 -top-10 transform rotate-12"></i>
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name?.split(' ')[0] || 'User'}!</h2>
                                    <p className="text-indigo-100 max-w-md">Track your orders, manage addresses, and check out new arrivals tailored for your clinic.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{user.orders?.length || 0}</h3>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-2xl flex items-center justify-center">
                                            <i className="fas fa-shopping-bag text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">Saved Addresses</p>
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{user.addresses?.length || 0}</h3>
                                        </div>
                                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-2xl flex items-center justify-center">
                                            <i className="fas fa-map-marked-alt text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">Account Status</p>
                                            <h3 className="text-2xl font-black text-green-500">Active</h3>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-2xl flex items-center justify-center">
                                            <i className="fas fa-user-check text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Reorder */}
                            <QuickReorder
                                onAddToCart={() => {}}
                                onProductClick={() => {}}
                            />

                            {/* Saved Payment Methods */}
                            <SavedPaymentMethods />

                            {/* Latest Order Tracking */}
                            {latestOrder && (
                                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Track Order #{latestOrder.id}</h3>
                                            <p className="text-sm text-gray-500">Expected Delivery: {latestOrder.status === 'Delivered' ? 'Delivered' : 'Oct 24, 2023'}</p>
                                        </div>
                                        <button onClick={() => setInvoiceOrder(latestOrder)} className="text-primary text-sm font-medium hover:underline">View Invoice</button>
                                    </div>
                                    <OrderTracker status={latestOrder.status} />
                                </div>
                            )}

                            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 dark:text-white">Recent Orders History</h3>
                                    <button onClick={() => setActiveTab('orders')} className="text-primary text-sm font-medium hover:underline">View All Orders</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Order ID</th>
                                                <th className="px-6 py-4 font-medium">Date</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {user.orders?.slice(0, 3).map(order => (
                                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{order.date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">₹{order.total.toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Orders</h2>
                            <div className="space-y-4">
                                {user.orders?.map(order => (
                                    <div key={order.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex gap-8 text-sm">
                                                <div>
                                                    <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Order Placed</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{order.date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Total</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">₹{order.total.toLocaleString('en-IN')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Order ID</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 flex-wrap">
                                                <button onClick={() => setInvoiceOrder(order)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Invoice</button>
                                                {['Processing', 'Pending'].includes(order.status) && (
                                                    <button
                                                        onClick={() => setCancelOrder(order)}
                                                        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {order.status === 'Delivered' && (
                                                    <button
                                                        onClick={() => setReturnOrder(order)}
                                                        className="px-4 py-2 border border-orange-300 dark:border-orange-600 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                    >
                                                        Return
                                                    </button>
                                                )}
                                                {(order.status === 'Shipped' || order.status === 'Delivered') && order.trackingNumber ? (
                                                    <button 
                                                        onClick={() => { setTrackingOrder(order); }}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                                    >
                                                        <i className="fas fa-truck text-xs"></i>
                                                        Track Order
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setTrackingOrder(order)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-pink-700 shadow-lg shadow-primary/20">
                                                        Track Order
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                {order.status === 'Shipped' && order.trackingNumber && (
                                                    <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <i className="fas fa-shipping-fast text-blue-600 text-xs"></i>
                                                        <span className="text-blue-800 dark:text-blue-300">
                                                            {order.courierName} • {order.trackingNumber}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 dark:border-gray-700/50 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                                <i className="fas fa-box text-gray-400 text-xl"></i>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-white text-base">{item.name}</p>
                                                                <p className="text-gray-500">Qty: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white text-base">₹{item.price ? item.price.toLocaleString('en-IN') : '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Returns Tab */}
                    {activeTab === 'returns' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Returns</h2>
                            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <i className="fas fa-undo text-4xl text-gray-300 mb-4"></i>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Return Requests</h3>
                                <p className="text-gray-500 text-sm mb-4">You haven't made any return requests yet.</p>
                                <p className="text-xs text-gray-400">Returns can be initiated from the My Orders tab for delivered orders within 15 days.</p>
                            </div>
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Addresses</h2>
                                <button
                                    onClick={handleAddNewAddress}
                                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-primary/20"
                                >
                                    <i className="fas fa-plus mr-2"></i> Add New Address
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {user.addresses.map((addr, idx) => (
                                    <div key={addr.id} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative group hover:border-primary/50 transition-colors">
                                        {addr.isDefault && (
                                            <span className="absolute top-4 right-4 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded uppercase tracking-wide">Default</span>
                                        )}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                <i className={`${addr.type === 'Home' ? 'fas fa-home' : 'fas fa-briefcase'}`}></i>
                                            </div>
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">{addr.type}</h3>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-6 pl-13">
                                            <p className="font-bold text-gray-900 dark:text-white text-base mb-1">{addr.name}</p>
                                            <p>{addr.street}</p>
                                            <p>{addr.city}, {addr.state} - {addr.zip}</p>
                                            <p className="mt-2 font-medium flex items-center gap-2"><i className="fas fa-phone-alt text-xs"></i> {addr.phone}</p>
                                        </div>
                                        <div className="flex gap-4 text-sm font-medium pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={() => handleEditAddress(addr, idx)} className="flex-1 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">Edit</button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="flex-1 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Profile Settings</h2>
                            <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-3xl">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                            <input type="text" defaultValue={user.name} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                            <input type="text" defaultValue={user.phone} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                            <input type="email" defaultValue={user.email} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                        </div>
                                    </div>

                                    {/* User Type & Verification Status */}
                                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Account Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                                                <select
                                                    value={selectedUserType}
                                                    onChange={(e) => setSelectedUserType(e.target.value as User['userType'])}
                                                    className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5"
                                                >
                                                    <option value="regular">Regular Customer</option>
                                                    <option value="dental-doctor">Dental Doctor</option>
                                                    <option value="student">Student</option>
                                                    <option value="supplier">Supplier</option>
                                                </select>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select your account type for personalized experience</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Status</label>
                                                <div className="flex items-center h-[42px]">
                                                    {user.verificationStatus === 'approved' && (
                                                        <span className="inline-flex items-center px-4 py-2 rounded-xl bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-semibold text-sm">
                                                            <i className="fas fa-check-circle mr-2"></i>
                                                            Verified
                                                        </span>
                                                    )}
                                                    {user.verificationStatus === 'pending' && (
                                                        <span className="inline-flex items-center px-4 py-2 rounded-xl bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-semibold text-sm">
                                                            <i className="fas fa-clock mr-2"></i>
                                                            Pending Verification
                                                        </span>
                                                    )}
                                                    {user.verificationStatus === 'rejected' && (
                                                        <span className="inline-flex items-center px-4 py-2 rounded-xl bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-semibold text-sm">
                                                            <i className="fas fa-times-circle mr-2"></i>
                                                            Not Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact admin for verification updates</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Professional Information */}
                                    {selectedUserType && selectedUserType !== 'regular' && (
                                        <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                    {selectedUserType === 'dental-doctor' && 'Dental Doctor Information'}
                                                    {selectedUserType === 'student' && 'Student Information'}
                                                    {selectedUserType === 'supplier' && 'Supplier Information'}
                                                </h3>
                                                {user.verificationStatus === 'approved' && (
                                                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-bold">
                                                        <i className="fas fa-lock mr-1"></i>
                                                        Verified & Locked
                                                    </span>
                                                )}
                                            </div>

                                            {user.verificationStatus === 'approved' && (
                                                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                                                    <div className="flex gap-2 text-sm text-blue-800 dark:text-blue-300">
                                                        <i className="fas fa-info-circle mt-0.5"></i>
                                                        <p>Your professional information is locked after verification. Contact admin to make changes.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dental Doctor Fields */}
                                            {selectedUserType === 'dental-doctor' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License ID</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter your license ID"
                                                            defaultValue={user.dentalDoctorInfo?.licenseId || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License State</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter license state"
                                                            defaultValue={user.dentalDoctorInfo?.licenseState || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter your specialization"
                                                            defaultValue={user.dentalDoctorInfo?.specialization || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinic Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter clinic name"
                                                            defaultValue={user.dentalDoctorInfo?.clinicName || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Student Fields */}
                                            {selectedUserType === 'student' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter your student ID"
                                                            defaultValue={user.studentInfo?.studentId || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter institution name"
                                                            defaultValue={user.studentInfo?.institution || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter course name"
                                                            defaultValue={user.studentInfo?.course || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year of Study</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Enter year"
                                                            defaultValue={user.studentInfo?.yearOfStudy || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Supplier Fields */}
                                            {selectedUserType === 'supplier' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter GST number"
                                                            defaultValue={user.supplierInfo?.gstNumber || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter business name"
                                                            defaultValue={user.supplierInfo?.businessName || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Type</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter business type"
                                                            defaultValue={user.supplierInfo?.businessType || ''}
                                                            disabled={user.verificationStatus === 'approved'}
                                                            className={`w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5 ${user.verificationStatus === 'approved' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Change Password</h3>
                                        <div className="space-y-4 max-w-xl">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                                <input type="password" className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                                    <input type="password" className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                                    <input type="password" className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary py-2.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-primary/25">
                                            Save Changes
                                        </button>
                                    </div>

                                    {/* Verification Manager Integration */}
                                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700 mt-8">
                                        <VerificationManager
                                            userId={user.id}
                                            isVerified={user.verificationStatus === 'approved'}
                                            userType={selectedUserType}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}></div>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md relative z-10 shadow-2xl p-6 text-center transform transition-all scale-100">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{deleteConfirmation.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">{deleteConfirmation.message}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteConfirmation.onConfirm}
                                className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Address Edit/Add Modal */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)}></div>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md relative z-10 shadow-2xl animate-fade-in p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                            {editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        <form onSubmit={handleSaveAddress} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                    <select
                                        value={addressFormData.type}
                                        onChange={e => setAddressFormData({ ...addressFormData, type: e.target.value as any })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Clinic">Clinic</option>
                                        <option value="Office">Office</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressFormData.name}
                                        onChange={e => setAddressFormData({ ...addressFormData, name: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                        placeholder="e.g. My Clinic"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Street Address</label>
                                <input
                                    type="text"
                                    required
                                    value={addressFormData.street}
                                    onChange={e => setAddressFormData({ ...addressFormData, street: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressFormData.city}
                                        onChange={e => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressFormData.state}
                                        onChange={e => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">ZIP Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressFormData.zip}
                                        onChange={e => setAddressFormData({ ...addressFormData, zip: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressFormData.phone}
                                        onChange={e => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={addressFormData.isDefault}
                                    onChange={e => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                                    className="rounded text-primary focus:ring-primary border-gray-300"
                                />
                                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">Set as default address</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-pink-700 text-sm font-medium"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tracking Modal */}
            {trackingOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <i className="fas fa-truck"></i> Order Tracking
                                    </h3>
                                    <p className="text-sm text-white/80 mt-1">Order #{trackingOrder.id}</p>
                                </div>
                                <button
                                    onClick={() => { setTrackingOrder(null); setTrackingData(null); }}
                                    className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Tracking Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                        <i className="fas fa-shipping-fast text-blue-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{trackingOrder.courierName || 'Courier'}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">AWB: {trackingOrder.trackingNumber}</p>
                                    </div>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                    trackingOrder.status === 'Delivered' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                    <i className={`fas ${trackingOrder.status === 'Delivered' ? 'fa-check-circle' : 'fa-truck'}`}></i>
                                    {trackingOrder.status}
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-white">Order Timeline</h4>
                                
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                    
                                    {/* Order Placed */}
                                    <div className="relative flex items-start gap-4 pb-6">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10">
                                            <i className="fas fa-check text-white text-xs"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Order Placed</p>
                                            <p className="text-sm text-gray-500">{trackingOrder.date}</p>
                                        </div>
                                    </div>

                                    {/* Processing */}
                                    <div className="relative flex items-start gap-4 pb-6">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center z-10">
                                            <i className="fas fa-box text-white text-xs"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Processing</p>
                                            <p className="text-sm text-gray-500">Order confirmed and being prepared</p>
                                        </div>
                                    </div>

                                    {/* Shipped */}
                                    <div className={`relative flex items-start gap-4 pb-6 ${trackingOrder.status === 'Shipped' || trackingOrder.status === 'Delivered' ? '' : 'opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${trackingOrder.status === 'Shipped' || trackingOrder.status === 'Delivered' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                            <i className={`fas fa-truck text-white text-xs ${trackingOrder.status === 'Shipped' || trackingOrder.status === 'Delivered' ? '' : 'opacity-50'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Shipped</p>
                                            <p className="text-sm text-gray-500">
                                                {trackingOrder.courierName} - {trackingOrder.trackingNumber}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delivered */}
                                    <div className={`relative flex items-start gap-4 ${trackingOrder.status === 'Delivered' ? '' : 'opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${trackingOrder.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <i className={`fas fa-home text-white text-xs ${trackingOrder.status === 'Delivered' ? '' : 'opacity-50'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Delivered</p>
                                            <p className="text-sm text-gray-500">
                                                {trackingOrder.status === 'Delivered' ? 'Order delivered successfully' : 'Pending delivery'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Track on Courier Website */}
                            {trackingOrder.trackingNumber && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    {(() => {
                                        const courierUrls: Record<string, { url: string; name: string }> = {
                                            'Delhivery': { url: `https://www.delhivery.com/track/package/${trackingOrder.trackingNumber}`, name: 'Delhivery' },
                                            'BlueDart': { url: `https://www.bluedart.com/track?AWB=${trackingOrder.trackingNumber}`, name: 'BlueDart' },
                                            'FedEx': { url: `https://www.fedex.com/fedextrack/?trknbr=${trackingOrder.trackingNumber}`, name: 'FedEx' },
                                            'DTDC': { url: `https://www.dtdc.com/tracking/track-result.php?strTdcval=${trackingOrder.trackingNumber}`, name: 'DTDC' },
                                            'India Post': { url: `https://www.indiapost.gov.in/Pages/TrackDocument.aspx?TrackingId=${trackingOrder.trackingNumber}`, name: 'India Post' },
                                            'Ekart': { url: `https://www.ekartlogistics.com/track/${trackingOrder.trackingNumber}`, name: 'Ekart' },
                                            'Shadowfax': { url: `https://www.shadowfax.in/track-order/?order_id=${trackingOrder.trackingNumber}`, name: 'Shadowfax' },
                                            'XpressBees': { url: `https://www.xpressbees.com/track/?tracking_id=${trackingOrder.trackingNumber}`, name: 'XpressBees' },
                                            'Shiprocket': { url: `https://shiprocket.co/tracking/${trackingOrder.trackingNumber}`, name: 'Shiprocket' },
                                        };
                                        
                                        const courier = courierUrls[trackingOrder.courierName || ''] || { 
                                            url: `https://shiprocket.co/tracking/${trackingOrder.trackingNumber}`, 
                                            name: trackingOrder.courierName || 'Courier' 
                                        };
                                        
                                        return (
                                            <a
                                                href={courier.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                                            >
                                                <i className="fas fa-external-link-alt"></i>
                                                Track on {courier.name} Website
                                            </a>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {invoiceOrder && (
                <InvoiceViewer
                    orderId={invoiceOrder.id}
                    onClose={() => setInvoiceOrder(null)}
                />
            )}

            {/* Cancel Order Modal */}
            {cancelOrder && (
                <CancelOrderModal
                    orderId={cancelOrder.id}
                    orderStatus={cancelOrder.status}
                    onClose={() => setCancelOrder(null)}
                    onSuccess={() => {
                        setCancelOrder(null);
                        alert('Order cancelled successfully. Refund will be processed within 5-7 business days.');
                    }}
                />
            )}

            {/* Return Request Modal */}
            {returnOrder && (
                <ReturnRequestModal
                    orderId={returnOrder.id}
                    items={returnOrder.items}
                    onClose={() => setReturnOrder(null)}
                    onSuccess={() => {
                        setReturnOrder(null);
                        alert('Return request submitted successfully. You will receive a confirmation email.');
                    }}
                />
            )}

            {/* Order Tracking Modal */}
            {trackingOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTrackingOrder(null)}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <OrderTracking orderId={trackingOrder.id} onClose={() => setTrackingOrder(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};
