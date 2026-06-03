import React, { useState } from 'react';
import { User, CartItem, Address, Coupon } from '../types';
import OptimizedImageMemo from './OptimizedImage';
import { initializeRazorpay, createRazorpayOrder, formatAmountForRazorpay, getRazorpayKey, RazorpayResponse } from '../utils/razorpayService';
import { couponsAPI } from '../utils/api';
import { addressSchema } from '../utils/schemas';
import { z } from 'zod';
import { toast } from 'sonner';

interface CheckoutProps {
    cart: CartItem[];
    user: User;
    onUpdateUser: (data: Partial<User>) => void;
    onPlaceOrder: (paymentId: string, transactionId: string, signature?: string, paymentMethod?: string) => void;
    onNavigateBack: () => void;
    razorpayKey?: string;
    appliedCoupon?: Coupon | null;
    onApplyCoupon?: (coupon: Coupon | null) => void;
    settings?: any;
}

export const Checkout: React.FC<CheckoutProps> = ({
    cart,
    user,
    onUpdateUser,
    onPlaceOrder,
    onNavigateBack,
    razorpayKey,
    appliedCoupon,
    onApplyCoupon,
    settings
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
        user.addresses?.find(a => a.isDefault)?.id || (user.addresses?.length > 0 ? user.addresses[0].id : null)
    );
    const [isProcessing, setIsProcessing] = useState(false);

    // Verification Gate Modal State
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isSavingVerification, setIsSavingVerification] = useState(false);
    const [verifSelectedType, setVerifSelectedType] = useState<User['userType']>(
        user.userType && user.userType !== 'regular' ? user.userType : 'dental-doctor'
    );
    const [verifFormData, setVerifFormData] = useState({
        // Dental Doctor fields
        licenseId: (user as any).dentalDoctorInfo?.licenseId || '',
        licenseState: (user as any).dentalDoctorInfo?.licenseState || '',
        clinicName: (user as any).dentalDoctorInfo?.clinicName || '',
        // Student fields
        studentId: (user as any).dentalStudentInfo?.studentId || '',
        institution: (user as any).dentalStudentInfo?.institution || '',
        course: (user as any).dentalStudentInfo?.course || '',
        yearOfStudy: (user as any).dentalStudentInfo?.yearOfStudy || '',
        // Business fields
        gstNumber: (user as any).dentalBusinessInfo?.gstNumber || '',
        businessName: (user as any).dentalBusinessInfo?.businessName || '',
        businessType: (user as any).dentalBusinessInfo?.businessType || '',
    });

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
    
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            discount = (subtotal * appliedCoupon.value) / 100;
            if (appliedCoupon.maxDiscount) {
                discount = Math.min(discount, appliedCoupon.maxDiscount);
            }
        } else {
            discount = appliedCoupon.value;
        }
    }

    // Dynamic Indian State shipping zone calculation (Option A)
    const selectedAddress = user.addresses?.find(a => a.id === selectedAddressId);
    const standardRate = settings?.shipping?.standardRate ?? 150;
    const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 5000;
    
    let resolvedShippingRate = standardRate;
    if (selectedAddress && settings?.shipping?.stateRules) {
        const matchedRule = settings.shipping.stateRules.find((rule: any) => 
            rule.states?.some((stateName: string) => 
                stateName.toLowerCase().trim() === selectedAddress.state?.toLowerCase().trim()
            )
        );
        if (matchedRule) {
            resolvedShippingRate = matchedRule.amount;
        }
    }

    const shipping = subtotal > freeShippingThreshold ? 0 : resolvedShippingRate;
    const total = Math.max(0, subtotal - discount + shipping);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplying(true);
        setCouponError('');
        try {
            const coupon = await couponsAPI.validate(couponCode, subtotal);
            if (onApplyCoupon) onApplyCoupon(coupon);
            setCouponCode('');
        } catch (err: any) {
            setCouponError(err.response?.data?.error || 'Invalid coupon code');
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        if (onApplyCoupon) onApplyCoupon(null);
    };

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

        try {
            addressSchema.parse(addressFormData);
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.issues[0].message);
                return;
            }
        }

        let newAddresses = user.addresses ? [...user.addresses] : [];

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
        toast.success('Address saved successfully');
    };

    // Check if user can proceed to payment - must be professional and verified/pending
    const canProceedToPayment = (): boolean => {
        const isRegular = !user.userType || user.userType === 'regular';
        const vStatus = user.verificationStatus;
        if (isRegular) return false;
        return vStatus === 'approved' || vStatus === 'pending';
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingVerification(true);
        try {
            const updateData: Partial<User> = {
                userType: verifSelectedType,
                verificationStatus: 'pending',
                isVerified: false,
            };
            if (verifSelectedType === 'dental-doctor') {
                updateData.dentalDoctorInfo = {
                    licenseId: verifFormData.licenseId,
                    licenseState: verifFormData.licenseState,
                    clinicName: verifFormData.clinicName,
                } as any;
            } else if (verifSelectedType === 'dental-student') {
                updateData.dentalStudentInfo = {
                    studentId: verifFormData.studentId,
                    institution: verifFormData.institution,
                    course: verifFormData.course,
                    yearOfStudy: Number(verifFormData.yearOfStudy) || 1,
                } as any;
            } else if (verifSelectedType === 'dental-business') {
                updateData.dentalBusinessInfo = {
                    gstNumber: verifFormData.gstNumber,
                    businessName: verifFormData.businessName,
                    businessType: verifFormData.businessType,
                } as any;
            }
            await onUpdateUser(updateData);
            setIsVerificationModalOpen(false);
            toast.success('Professional details submitted! Your account is now pending verification. You can proceed to payment.');
            // Proceed to payment automatically after verification submit
            setTimeout(() => handlePaymentCore(), 500);
        } catch (err) {
            toast.error('Failed to save details. Please try again.');
        } finally {
            setIsSavingVerification(false);
        }
    };

    const handlePaymentCore = async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }
        setIsProcessing(true);
        try {
            if (selectedPaymentMethod === 'cod') {
                const mockPaymentId = 'cod_' + Date.now();
                const mockTransactionId = 'trans_cod_' + Date.now();
                await onPlaceOrder(mockPaymentId, mockTransactionId, undefined, 'cod');
                toast.success('Order placed successfully with Cash on Delivery!');
                return;
            }

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
                handler: (response: RazorpayResponse) => {
                    onPlaceOrder(response.razorpay_payment_id, orderId, response.razorpay_signature, 'razorpay');
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: { color: '#DD3B5F' },
                modal: { ondismiss: () => { setIsProcessing(false); } }
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

    const handlePayment = async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }

        // Gate: Only professional (non-regular) users with pending/approved status can pay
        if (!canProceedToPayment()) {
            setIsVerificationModalOpen(true);
            return;
        }

        await handlePaymentCore();
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

                        {(!user.addresses || user.addresses.length === 0) ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-4">No addresses found.</p>
                                <button onClick={handleAddNewAddress} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-pink-700 transition-colors">
                                    Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.addresses?.map((addr, idx) => (
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

                    {/* Payment Method Selector */}
                    <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                            <i className="fas fa-credit-card text-primary"></i> Payment Method
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Razorpay Online */}
                            <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'razorpay' ? 'border-primary bg-pink-50/5 dark:bg-pink-950/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark hover:border-gray-300'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-sm text-gray-800 dark:text-white">Pay Online Securely</span>
                                    <input type="radio" name="paymentMethod" checked={selectedPaymentMethod === 'razorpay'} onChange={() => setSelectedPaymentMethod('razorpay')} className="text-primary focus:ring-primary h-4 w-4" />
                                </div>
                                <span className="text-xs text-gray-500">Supports UPI, NetBanking, Cards & Wallets (Powered by Razorpay)</span>
                            </label>

                            {/* Cash on Delivery */}
                            {settings?.payment?.cod?.enabled && (() => {
                                const minCODAmount = settings.payment.cod.minAmount || 0;
                                const isEligible = subtotal >= minCODAmount;

                                return (
                                    <label className={`flex flex-col p-4 border rounded-xl transition-all ${!isEligible ? 'opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/10 border-gray-200 dark:border-gray-700' : selectedPaymentMethod === 'cod' ? 'border-primary bg-pink-50/5 dark:bg-pink-950/5 cursor-pointer' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark hover:border-gray-300 cursor-pointer'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm text-gray-800 dark:text-white">Cash on Delivery (COD)</span>
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                disabled={!isEligible}
                                                checked={selectedPaymentMethod === 'cod'} 
                                                onChange={() => {
                                                    if (isEligible) setSelectedPaymentMethod('cod');
                                                }} 
                                                className="text-primary focus:ring-primary h-4 w-4 disabled:opacity-50" 
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">Pay cash upon safe delivery at your clinic or office.</span>
                                        {!isEligible && (
                                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded">
                                                <i className="fas fa-circle-exclamation"></i>
                                                <span>Minimum purchase of ₹{minCODAmount.toLocaleString('en-IN')} required for COD</span>
                                            </div>
                                        )}
                                    </label>
                                );
                            })()}
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
                                        <OptimizedImageMemo src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" width={64} height={64} />
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
                            {/* Coupon Section */}
                            {!appliedCoupon ? (
                                <div className="space-y-2 mb-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Coupon Code"
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-primary outline-none"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isApplying || !couponCode}
                                            className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50 transition-colors"
                                        >
                                            {isApplying ? <i className="fas fa-spinner fa-spin"></i> : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-[10px] text-red-500 font-medium ml-1">{couponError}</p>}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/50 mb-4">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-tag text-green-600 text-xs"></i>
                                        <span className="text-xs font-bold text-green-700 dark:text-green-400">{appliedCoupon.code} Applied</span>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-green-700 dark:text-green-400 hover:text-red-500 transition-colors">
                                        <i className="fas fa-times-circle"></i>
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600 font-medium">Discount</span>
                                    <span className="font-bold text-green-600">-₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

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
                                    <span>{selectedPaymentMethod === 'cod' ? `Place COD Order (₹${total.toLocaleString('en-IN')})` : `Pay ₹${total.toLocaleString('en-IN')}`}</span>
                                    <i className="fas fa-arrow-right"></i>
                                </>
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <i className="fas fa-lock"></i>
                            <span>{selectedPaymentMethod === 'cod' ? 'Safe and Secure Ordering' : 'Secure Checkout powered by Razorpay'}</span>
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

            {/* Professional Verification Gate Modal */}
            {isVerificationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsVerificationModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-rose-500 p-6 text-white">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <i className="fas fa-shield-alt text-lg"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Professional Verification Required</h2>
                                    <p className="text-white/80 text-sm">Alpha Dentkart is exclusively for dental professionals</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleVerificationSubmit} className="p-6 space-y-5">
                            {/* Info banner */}
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                                <i className="fas fa-info-circle text-amber-500 mt-0.5 flex-shrink-0"></i>
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Please select your professional type and enter your credentials. Your account will be set to <strong>Pending Verification</strong> and you can proceed to payment immediately while our team reviews your details.
                                </p>
                            </div>

                            {/* Role Selector */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    I am a <span className="text-primary">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'dental-doctor', label: 'Dental Doctor', icon: 'fas fa-tooth' },
                                        { value: 'dental-student', label: 'Student', icon: 'fas fa-graduation-cap' },
                                        { value: 'dental-business', label: 'Business', icon: 'fas fa-building' },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setVerifSelectedType(option.value as User['userType'])}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                                                verifSelectedType === option.value
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <i className={`${option.icon} text-lg`}></i>
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dental Doctor Fields */}
                            {verifSelectedType === 'dental-doctor' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">License ID <span className="text-primary">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. MCI-2024-XXXX"
                                                value={verifFormData.licenseId}
                                                onChange={e => setVerifFormData({ ...verifFormData, licenseId: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">License State <span className="text-primary">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Maharashtra"
                                                value={verifFormData.licenseState}
                                                onChange={e => setVerifFormData({ ...verifFormData, licenseState: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Clinic Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Smile Dental Clinic"
                                            value={verifFormData.clinicName}
                                            onChange={e => setVerifFormData({ ...verifFormData, clinicName: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Student Fields */}
                            {verifSelectedType === 'dental-student' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Student ID <span className="text-primary">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. BDS-2024-001"
                                                value={verifFormData.studentId}
                                                onChange={e => setVerifFormData({ ...verifFormData, studentId: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Year of Study <span className="text-primary">*</span></label>
                                            <select
                                                required
                                                value={verifFormData.yearOfStudy}
                                                onChange={e => setVerifFormData({ ...verifFormData, yearOfStudy: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            >
                                                <option value="">Select Year</option>
                                                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Institution <span className="text-primary">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Government Dental College, Mumbai"
                                            value={verifFormData.institution}
                                            onChange={e => setVerifFormData({ ...verifFormData, institution: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. BDS, MDS"
                                            value={verifFormData.course}
                                            onChange={e => setVerifFormData({ ...verifFormData, course: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Business Fields */}
                            {verifSelectedType === 'dental-business' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">GST Number <span className="text-primary">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 22AAAAA0000A1Z5"
                                                value={verifFormData.gstNumber}
                                                onChange={e => setVerifFormData({ ...verifFormData, gstNumber: e.target.value.toUpperCase() })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Business Type <span className="text-primary">*</span></label>
                                            <select
                                                required
                                                value={verifFormData.businessType}
                                                onChange={e => setVerifFormData({ ...verifFormData, businessType: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="distributor">Distributor</option>
                                                <option value="manufacturer">Manufacturer</option>
                                                <option value="retailer">Retailer</option>
                                                <option value="hospital">Hospital/Clinic</option>
                                                <option value="lab">Dental Lab</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Business Name <span className="text-primary">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. ABC Dental Supplies Pvt. Ltd."
                                            value={verifFormData.businessName}
                                            onChange={e => setVerifFormData({ ...verifFormData, businessName: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Footer actions */}
                            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsVerificationModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingVerification}
                                    className="flex-[2] py-3 bg-gradient-to-r from-primary to-rose-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSavingVerification ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                    ) : (
                                        <><i className="fas fa-check-circle"></i> Submit & Proceed to Pay</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
