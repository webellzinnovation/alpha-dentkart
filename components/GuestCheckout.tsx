import React, { useState } from 'react';
import api from '../utils/api';

interface GuestCheckoutProps {
  cart: any[];
  onOrderSuccess: (orderId: string) => void;
  onCancel: () => void;
}

export const GuestCheckout: React.FC<GuestCheckoutProps> = ({ cart, onOrderSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    paymentMethod: 'cod' as 'cod' | 'razorpay'
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shipping;

  const createSession = async () => {
    try {
      const response = await api.post('/guest/session/create', {
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity }))
      });
      setSessionId(response.data.sessionId);
      return response.data.sessionId;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const sid = sessionId || await createSession();
      if (!sid) {
        setError('Failed to create checkout session. Please try again.');
        setLoading(false);
        return;
      }

      const response = await api.post('/guest/order/create', {
        sessionId: sid,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          name: formData.name,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        total
      });

      onOrderSuccess(response.data.order?.id || sid);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Order placement failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full py-8">
      <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
        <i className="fas fa-arrow-left"></i> Back to Shopping
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8">Guest Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['Details', 'Address', 'Payment'].map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {step > i + 1 ? <i className="fas fa-check text-xs"></i> : i + 1}
              </div>
              <span className="text-xs mt-1 text-gray-500">{label}</span>
            </div>
            {i < 2 && <div className={`w-16 md:w-24 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Step 1: Customer Details */}
          {step === 1 && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-user text-primary"></i> Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" placeholder="Enter your name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" placeholder="your@email.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                  <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" placeholder="+91 XXXXX XXXXX" required />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => formData.name && formData.email && formData.phone ? setStep(2) : setError('Please fill all required fields')} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-pink-700">
                  Continue <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Address */}
          {step === 2 && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-primary"></i> Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address *</label>
                  <input type="text" value={formData.street} onChange={e => updateField('street', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                    <input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                    <input type="text" value={formData.state} onChange={e => updateField('state', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code *</label>
                  <input type="text" value={formData.zip} onChange={e => updateField('zip', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800" maxLength={6} required />
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-arrow-left mr-1"></i> Back
                </button>
                <button onClick={() => formData.street && formData.city && formData.state && formData.zip ? setStep(3) : setError('Please fill all address fields')} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-pink-700">
                  Continue <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-credit-card text-primary"></i> Payment Method
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" checked={formData.paymentMethod === 'cod'} onChange={() => updateField('paymentMethod', 'cod')} className="text-primary" />
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                    <i className="fas fa-money-bill-wave"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when you receive</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${formData.paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" checked={formData.paymentMethod === 'razorpay'} onChange={() => updateField('paymentMethod', 'razorpay')} className="text-primary" />
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Razorpay (Online)</p>
                    <p className="text-xs text-gray-500">Cards, UPI, NetBanking</p>
                  </div>
                </label>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <i className="fas fa-info-circle mr-1"></i>
                  Create a free account after checkout to track your order and earn rewards!
                </p>
              </div>

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-arrow-left mr-1"></i> Back
                </button>
                <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-pink-700 disabled:opacity-50">
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : ''}
                  Place Order - ₹{total.toLocaleString('en-IN')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.cartItemId || item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0 p-1">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
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
                {shipping === 0 ? <span className="font-bold text-green-500">FREE</span> : <span className="font-medium text-gray-900 dark:text-white">₹{shipping}</span>}
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 dark:border-gray-700 pt-3">
                <span className="text-gray-800 dark:text-white">Total</span>
                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
