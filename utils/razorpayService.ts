// Razorpay Payment Service

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id?: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

// Load Razorpay SDK dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        // Check if already loaded
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
            resolve(true);
        };

        script.onerror = () => {
            resolve(false);
        };

        document.body.appendChild(script);
    });
};

// Create Razorpay order (simulated for frontend-only app)
export const createRazorpayOrder = (amount: number): string => {
    // In production, this should be done on the backend
    // For now, we'll generate a mock order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return orderId;
};

// Initialize Razorpay payment
export const initializeRazorpay = async (options: RazorpayOptions): Promise<boolean> => {
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
        console.error('Razorpay SDK failed to load');
        return false;
    }

    try {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        return true;
    } catch (error) {
        console.error('Error initializing Razorpay:', error);
        return false;
    }
};

// Get payment settings from localStorage
export const getPaymentSettings = () => {
    try {
        const settings = localStorage.getItem('paymentSettings');
        if (settings) {
            return JSON.parse(settings);
        }
    } catch (error) {
        console.error('Error loading payment settings:', error);
    }

    // Return default settings with env variables as fallback
    return {
        enabled: true,
        testMode: true,
        keyId: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
        secretKey: process.env.REACT_APP_RAZORPAY_SECRET || ''
    };
};

// Save payment settings to localStorage
export const savePaymentSettings = (settings: any) => {
    try {
        localStorage.setItem('paymentSettings', JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving payment settings:', error);
        return false;
    }
};

// Verify payment signature (basic validation)
// Note: In production, this MUST be done on the backend for security
export const verifyPaymentSignature = (
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string
): boolean => {
    // This is a simplified version
    // In production, use crypto library on backend
    console.warn('Payment verification should be done on backend for security');

    // For now, just check if all values exist
    return !!(orderId && paymentId && signature);
};

// Format amount for Razorpay (convert to paise)
export const formatAmountForRazorpay = (amount: number): number => {
    return Math.round(amount * 100);
};

// Format amount from Razorpay (convert from paise to rupees)
export const formatAmountFromRazorpay = (amount: number): number => {
    return amount / 100;
};

// Get Razorpay key based on mode
export const getRazorpayKey = (): string => {
    const settings = getPaymentSettings();
    return settings.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID || '';
};

// Check if payment gateway is enabled
export const isPaymentGatewayEnabled = (): boolean => {
    const settings = getPaymentSettings();
    return settings.enabled !== false;
};
