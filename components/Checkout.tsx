import React, { useState } from 'react';
import { User, CartItem, Address } from '../types';
import { initializeRazorpay, createRazorpayOrder, formatAmountForRazorpay, getRazorpayKey, RazorpayResponse } from '../utils/razorpayService';

interface CheckoutProps {
    cart: CartItem[];
    user: User;
    onUpdateUser: (data: Partial<User>) => void;
    onPlaceOrder: (paymentId: string, transactionId: string) => void;
    onNavigateBack: () => void;
    razorpayKey?: string;
}

export const Checkout: React.FC<CheckoutProps> = ({
    cart,
    user,
    onUpdateUser,
    onPlaceOrder,
    onNavigateBack,
    razorpayKey
}) => {
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
        user.addresses.find(a => a.isDefault)?.id || (user.addresses.length > 0 ? user.addresses[0].id : null)
    );
    const [isProcessing, setIsProcessing] = useState(false);

    // Address Modal State (Adapted from Dashboard)
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

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 150; // Mock shipping logic
    const total = subtotal + shipping;

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
            // If first address, select it
            if (newAddresses.length === 1) {
                setSelectedAddressId(addressFormData.id);
            }
        }

        onUpdateUser({ addresses: newAddresses });
        setIsAddressModalOpen(false);
    };

    const handlePayment = async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }

        setIsProcessing(true);

        try {
            const orderId = createRazorpayOrder(total);

            const keyToUse = razorpayKey || getRazorpayKey();

            if (!keyToUse) {
                alert('Payment gateway not configured. Please contact admin.');
                setIsProcessing(false);
                return;
            }

            const success = await initializeRazorpay({
                key: keyToUse,
                amount: formatAmountForRazorpay(total),
                currency: 'INR',
                name: 'Alpha Dentkart',
                description: `Order for ${cart.length} items`,
                // order_id: orderId, // Removed to support client-side testing without backend
                handler: (response: RazorpayResponse) => {
                    onPlaceOrder(response.razorpay_payment_id, orderId);
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: {
                    color: '#DD3B5F'
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                }
            });

            if (!success) {
                alert('Failed to initialize payment. Please try again.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full py-8">
            <button onClick={onNavigateBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                <i className="fas fa-arrow-left"></i> Back to Shopping
            </button>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8">Checkout</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Address Selection */}
                <div className="flex-1 space-y-8">

                    <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <i className="fas fa-map-marker-alt text-primary"></i> Shipping Address
                            </h2>
                            <button onClick={handleAddNewAddress} className="text-primary text-sm font-bold hover:underline">
                                + Add New
                            </button>
                        </div>

                        {user.addresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-4">No addresses found.</p>
                                <button onClick={handleAddNewAddress} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-pink-700 transition-colors">
                                    Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.addresses.map((addr, idx) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
                                    >
                                        {selectedAddressId === addr.id && (
                                            <div className="absolute top-3 right-3 text-primary">
                                                <i className="fas fa-check-circle text-xl"></i>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-gray-800 dark:text-white">{addr.type}</span>
                                            {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Default</span>}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{addr.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {addr.street}<br />
                                            {addr.city}, {addr.state} {addr.zip}<br />
                                            Phone: {addr.phone}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditAddress(addr, idx);
                                            }}
                                            className="text-xs text-primary font-medium mt-3 hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Payment Method - For now static */}
                    <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <i className="fas fa-credit-card text-primary"></i> Payment Method
                        </h2>
                        <div className="p-4 border border-primary/30 bg-primary/5 rounded-xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white">Razorpay Secure Payment</p>
                                <p className="text-xs text-gray-500">Cards, UPI, NetBanking, Wallets</p>
                            </div>
                            <div className="ml-auto">
                                <i className="fas fa-check-circle text-primary text-xl"></i>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Right Column: Order Summary */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                            {cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-3">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0 p-1">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                                        <p className="text-sm font-bold text-primary mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                {shipping === 0 ? (
                                    <span className="font-bold text-green-500">FREE</span>
                                ) : (
                                    <span className="font-medium text-gray-900 dark:text-white">₹{shipping}</span>
                                )}
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-gray-100 dark:border-gray-700 pt-3">
                                <span className="text-gray-800 dark:text-white">Total</span>
                                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing || cart.length === 0}
                            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Pay ₹{total.toLocaleString('en-IN')}</span>
                                    <i className="fas fa-arrow-right"></i>
                                </>
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <i className="fas fa-lock"></i>
                            <span>Secure Checkout powered by Razorpay</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Edit/Add Modal (Reused) */}
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
        </div>
    );
};
