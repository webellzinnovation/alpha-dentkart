export interface SavedPaymentMethodData {
    userId: string;
    type: 'card' | 'upi' | 'netbanking';
    gateway: 'razorpay' | 'phonepe';
    token: string;
    last4?: string;
    brand?: string;
    expiry?: string;
    holderName?: string;
    bankName?: string;
    upiId?: string;
    isDefault?: boolean;
}
export interface PaymentMethodResponse {
    success: boolean;
    paymentMethod?: any;
    error?: string;
}
export declare class SavedPaymentService {
    constructor();
    savePaymentMethod(data: SavedPaymentMethodData): Promise<PaymentMethodResponse>;
    getUserPaymentMethods(userId: string): Promise<any[]>;
    getPaymentMethodById(id: string, userId: string): Promise<any | null>;
    updatePaymentMethod(id: string, userId: string, updates: Partial<SavedPaymentMethodData>): Promise<PaymentMethodResponse>;
    deletePaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse>;
    setDefaultPaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse>;
    getDefaultPaymentMethod(userId: string): Promise<any | null>;
    getPaymentMethodsByGateway(userId: string, gateway: string): Promise<any[]>;
    validatePaymentToken(token: string, gateway: 'razorpay' | 'phonepe'): Promise<{
        isValid: boolean;
        last4?: string;
        brand?: string;
        expiry?: string;
        error?: string;
    }>;
    getPaymentMethodStats(userId: string): Promise<any>;
}
export default SavedPaymentService;
//# sourceMappingURL=savedPaymentService.d.ts.map