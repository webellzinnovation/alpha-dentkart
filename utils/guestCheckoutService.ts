// Frontend Guest Checkout Service for Alpha Dentkart
// Handles guest shopping experience without requiring registration
import React, { useState, useEffect } from 'react';

export interface GuestSession {
    sessionId: string;
    email?: string;
    phone?: string;
    expiresAt: string;
    orderCount: number;
}

export interface GuestOrderData {
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
            country: string;
            type: 'Home' | 'Clinic' | 'Office';
            isDefault: boolean;
        };
    };
    items: Array<{
        productId: number;
        quantity: number;
        selectedAttributes?: Record<string, string>;
    }>;
    total: number;
    shippingCharges: number;
    paymentMethod: 'razorpay' | 'phonepe' | 'cod';
    guestSessionId?: string;
}

export interface GuestOrderResponse {
    orderId: string;
    customerName: string;
    status: string;
    total: number;
    paymentStatus: string;
    guestEmail?: string;
    guestPhone?: string;
    items?: any[];
    shippingAddress?: any;
    createdAt?: string;
    updatedAt?: string;
}

export interface GuestCheckoutOptions {
    requireEmail?: boolean;
    requirePhone?: boolean;
    allowRegistration?: boolean;
    autoCreateAccount?: boolean;
}

class GuestCheckoutService {
    private baseURL: string;
    private currentSession: GuestSession | null = null;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }

    // API helper method
    private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseURL}/api/guest${endpoint}`;
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    }

    // Create guest session for tracking
    async createGuestSession(email?: string, phone?: string): Promise<GuestSession> {
        try {
            const response = await this.apiCall('/session/create', {
                method: 'POST',
                body: JSON.stringify({ email, phone }),
            });

            if (response.success) {
                this.currentSession = response.data;
                this.storeSession(response.data);
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create guest session');
            }
        } catch (error) {
            console.error('Create guest session error:', error);
            throw error;
        }
    }

    // Validate existing guest session
    async validateGuestSession(sessionId: string): Promise<GuestSession> {
        try {
            const response = await this.apiCall(`/session/validate/${sessionId}`, {
                method: 'GET',
            });

            if (response.success) {
                this.currentSession = response.data;
                return response.data;
            } else {
                throw new Error(response.message || 'Invalid guest session');
            }
        } catch (error) {
            console.error('Validate guest session error:', error);
            throw error;
        }
    }

    // Create guest order
    async createGuestOrder(orderData: GuestOrderData): Promise<GuestOrderResponse> {
        try {
            // Validate required fields
            this.validateOrderData(orderData);

            const response = await this.apiCall('/order/create', {
                method: 'POST',
                body: JSON.stringify(orderData),
            });

            if (response.success) {
                // Clear guest session after order creation
                if (this.currentSession) {
                    localStorage.removeItem('guest_session');
                }
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create guest order');
            }
        } catch (error) {
            console.error('Create guest order error:', error);
            throw error;
        }
    }

    // Get guest order details
    async getGuestOrder(orderId: string): Promise<GuestOrderResponse> {
        try {
            const response = await this.apiCall(`/order/${orderId}`, {
                method: 'GET',
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Guest order not found');
            }
        } catch (error) {
            console.error('Get guest order error:', error);
            throw error;
        }
    }

    // Update guest order
    async updateGuestOrder(orderId: string, updateData: Partial<GuestOrderResponse>): Promise<GuestOrderResponse> {
        try {
            const response = await this.apiCall(`/order/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update guest order');
            }
        } catch (error) {
            console.error('Update guest order error:', error);
            throw error;
        }
    }

    // Get order status with tracking
    async getGuestOrderStatus(orderId: string): Promise<GuestOrderResponse> {
        try {
            const response = await this.apiCall(`/order/${orderId}/status`, {
                method: 'GET',
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to get order status');
            }
        } catch (error) {
            console.error('Get guest order status error:', error);
            throw error;
        }
    }

    // Convert guest order to user account (optional)
    async convertGuestOrder(orderId: string, userId: string, accountData?: any): Promise<any> {
        try {
            const response = await this.apiCall(`/order/${orderId}/convert`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ userId, accountData }),
            });

            if (response.success) {
                // Update local user state
                localStorage.setItem('user_id', userId);
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to convert guest order');
            }
        } catch (error) {
            console.error('Convert guest order error:', error);
            throw error;
        }
    }

    // Get all orders for a guest session
    async getGuestOrders(sessionId: string): Promise<{ orders: GuestOrderResponse[] }> {
        try {
            const response = await this.apiCall(`/session/${sessionId}/orders`, {
                method: 'GET',
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to get guest orders');
            }
        } catch (error) {
            console.error('Get guest orders error:', error);
            throw error;
        }
    }

    // Validation helpers
    private validateOrderData(orderData: GuestOrderData): void {
        if (!orderData.customerInfo) {
            throw new Error('Customer information is required');
        }

        if (!orderData.customerInfo.name || orderData.customerInfo.name.trim().length < 2) {
            throw new Error('Customer name must be at least 2 characters');
        }

        if (!orderData.customerInfo.email || !this.validateEmail(orderData.customerInfo.email)) {
            throw new Error('Valid customer email is required');
        }

        if (!orderData.customerInfo.phone || !this.validatePhone(orderData.customerInfo.phone)) {
            throw new Error('Valid customer phone number is required');
        }

        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('At least one item must be in the order');
        }

        if (!orderData.total || orderData.total <= 0) {
            throw new Error('Order total must be greater than 0');
        }

        if (!orderData.paymentMethod || !['razorpay', 'phonepe', 'cod'].includes(orderData.paymentMethod)) {
            throw new Error('Valid payment method is required');
        }
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private validatePhone(phone: string): boolean {
        const phoneRegex = /^[6-9]\d{9,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    // Local storage helpers
    private storeSession(session: GuestSession): void {
        localStorage.setItem('guest_session', JSON.stringify(session));
        this.currentSession = session;
    }

    private getStoredSession(): GuestSession | null {
        try {
            const stored = localStorage.getItem('guest_session');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    // Check if guest session exists and is valid
    checkGuestSession(): GuestSession | null {
        const session = this.getStoredSession();
        if (!session) {
            return null;
        }

        if (new Date(session.expiresAt) < new Date()) {
            localStorage.removeItem('guest_session');
            return null;
        }

        this.currentSession = session;
        return session;
    }

    // Clear guest session
    clearGuestSession(): void {
        localStorage.removeItem('guest_session');
        this.currentSession = null;
    }

    // Get current guest session
    getCurrentSession(): GuestSession | null {
        return this.currentSession;
    }

    // Guest checkout flow management
    async startGuestCheckout(email?: string, phone?: string): Promise<GuestSession> {
        return await this.createGuestSession(email, phone);
    }

    // Calculate order total with shipping
    calculateOrderTotal(items: Array<{price: number; quantity: number}>, shipping: number): number {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return subtotal + shipping;
    }

    // Check if guest can checkout
    canGuestCheckout(options: GuestCheckoutOptions = {}): boolean {
        // Check if guest checkout is disabled
        if (options.requireEmail && !options.requirePhone) {
            return false;
        }

        return true; // Default: allow guest checkout
    }

    // Format order data for API
    formatOrderData(data: any): GuestOrderData {
        return {
            customerInfo: {
                name: data.customerInfo?.name || '',
                email: data.customerInfo?.email || '',
                phone: data.customerInfo?.phone || '',
                address: {
                    street: data.customerInfo?.address?.street || '',
                    city: data.customerInfo?.address?.city || '',
                    state: data.customerInfo?.address?.state || '',
                    zip: data.customerInfo?.address?.zip || '',
                    country: data.customerInfo?.address?.country || 'India',
                    type: data.customerInfo?.address?.type || 'Home',
                    isDefault: data.customerInfo?.address?.isDefault || false
                }
            },
            items: data.items || [],
            total: data.total || 0,
            shippingCharges: data.shippingCharges || 0,
            paymentMethod: data.paymentMethod || 'cod',
            guestSessionId: data.guestSessionId
        };
    }
}

// Create singleton instance
export const guestCheckoutService = new GuestCheckoutService();

// React hook for guest checkout
export const useGuestCheckout = (options: GuestCheckoutOptions = {}) => {
    const [session, setSession] = React.useState<GuestSession | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const currentSession = guestCheckoutService.checkGuestSession();
        setSession(currentSession);
    }, []);

    const startCheckout = async (email?: string, phone?: string) => {
        setLoading(true);
        setError(null);

        try {
            const guestSession = await guestCheckoutService.startGuestCheckout(email, phone);
            setSession(guestSession);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start guest checkout');
        } finally {
            setLoading(false);
        }
    };

    const createOrder = async (orderData: GuestOrderData) => {
        setLoading(true);
        setError(null);

        try {
            const order = await guestCheckoutService.createGuestOrder(orderData);
            return order;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create order');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const clearSession = () => {
        guestCheckoutService.clearGuestSession();
        setSession(null);
        setError(null);
    };

    return {
        session,
        loading,
        error,
        startCheckout,
        createOrder,
        clearSession,
        canCheckout: guestCheckoutService.canGuestCheckout(options)
    };
};

// Export types and service
export default guestCheckoutService;