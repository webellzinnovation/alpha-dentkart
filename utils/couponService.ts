// Frontend Coupon Service for Alpha Dentkart
// Handles coupon validation, application, and management
import { useState, useEffect } from 'react';

export interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
    applicableProducts?: string; // JSON array
    applicableCategories?: string; // JSON array
    userType?: 'all' | 'regular' | 'dental-doctor' | 'student' | 'supplier';
    createdAt: string;
    updatedAt: string;
}

export interface CouponValidation {
    success: boolean;
    message: string;
    data?: {
        coupon?: {
            id: string;
            code: string;
            type: string;
            value: string | number;
            description: string;
        };
        discountAmount?: number;
        discountedTotal?: number;
        minimumAmount?: number;
        currentAmount?: number;
        usageLimit?: number;
        currentUsage?: number;
        userUsageLimit?: number;
    };
    errors?: any[];
}

export interface CouponApplication {
    success: boolean;
    message: string;
    data?: {
        coupon?: {
            id: string;
            code: string;
            type: string;
            value: string | number;
            description: string;
        };
        discountAmount?: number;
        discountedTotal?: number;
        usedCouponId?: string;
    };
    errors?: any[];
}

export interface CouponAnalytics {
    success: boolean;
    message: string;
    data?: {
        analytics?: Array<{
            id: string;
            code: string;
            type: string;
            value: number;
            usageCount: number;
            createdAt: string;
            expiresAt: string;
            isActive: boolean;
        }>;
        summary?: {
            totalCoupons: number;
            activeCoupons: number;
            totalUsageCount: number;
            totalSavings: number;
        };
    };
    errors?: any[];
}

class CouponService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }

    // API helper method
    private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseURL}/api/coupons${endpoint}`;
        
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

    // Validate coupon for cart
    async validateCoupon(code: string, cartTotal: number, userId?: string): Promise<CouponValidation> {
        try {
            const response = await this.apiCall('/validate', {
                method: 'POST',
                body: JSON.stringify({ code, cartTotal, userId })
            });

            return response;
        } catch (error) {
            console.error('Validate coupon error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to validate coupon',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    // Apply coupon to cart
    async applyCoupon(code: string, cartTotal: number, userId?: string): Promise<CouponApplication> {
        try {
            const response = await this.apiCall('/apply', {
                method: 'POST',
                body: JSON.stringify({ code, cartTotal, userId }),
                headers: userId ? {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                } : {}
            });

            return response;
        } catch (error) {
            console.error('Apply coupon error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to apply coupon',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    // Get available coupons for user
    async getUserCoupons(userId?: string): Promise<Coupon[]> {
        try {
            const headers = userId ? {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {};

            const response = await this.apiCall('', {
                method: 'GET',
                headers
            });

            return response.success ? response.data : [];
        } catch (error) {
            console.error('Get user coupons error:', error);
            return [];
        }
    }

    // Get coupon by code
    async getCouponByCode(code: string): Promise<Coupon | null> {
        try {
            const response = await this.apiCall(`/${code}`, {
                method: 'GET'
            });

            return response.success ? response.data : null;
        } catch (error) {
            console.error('Get coupon by code error:', error);
            return null;
        }
    }

    // Apply coupon discount to cart total
    calculateDiscount(coupon: Coupon, cartTotal: number): number {
        let discountAmount = 0;
        
        if (coupon.type === 'percentage') {
            discountAmount = cartTotal * (coupon.value / 100);
        } else if (coupon.type === 'fixed') {
            discountAmount = coupon.value;
        } else if (coupon.type === 'free_shipping') {
            // Mock shipping charge - in production, fetch from Shiprocket
            discountAmount = 150;
        }

        // Apply maximum discount limit
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
            discountAmount = coupon.maximumDiscount;
        }

        return discountAmount;
    }

    // Format coupon description
    formatCouponDescription(coupon: Coupon): string {
        if (coupon.type === 'percentage') {
            return `${coupon.value}% discount on all orders`;
        } else if (coupon.type === 'fixed') {
            return `₹${coupon.value} off your order`;
        } else if (coupon.type === 'free_shipping') {
            return 'Free shipping on all orders';
        }
        return coupon.value ? `${coupon.value} discount` : 'Special offer';
    }

    // Check if coupon is valid for current user
    isCouponValidForUser(coupon: Coupon, userType?: string): boolean {
        // Check if coupon is active
        if (!coupon.isActive) {
            return false;
        }

        // Check expiry
        const expiresAt = new Date(coupon.expiresAt);
        if (expiresAt < new Date()) {
            return false;
        }

        // Check start date
        const startsAt = new Date(coupon.startsAt);
        if (startsAt > new Date()) {
            return false;
        }

        // Check user type restriction
        if (coupon.userType && coupon.userType !== 'all' && userType) {
            return coupon.userType === userType;
        }

        return true;
    }

    // Check if coupon can be applied to cart
    canApplyToCart(coupon: Coupon, cartTotal: number): { isValid: boolean; reason?: string } {
        // Check minimum amount requirement
        if (coupon.minimumAmount && cartTotal < coupon.minimumAmount) {
            return {
                isValid: false,
                reason: `Minimum order amount of ₹${coupon.minimumAmount} required`
            };
        }

        // Check usage limits
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return {
                isValid: false,
                reason: 'Coupon usage limit reached'
            };
        }

        // Check if expired
        const expiresAt = new Date(coupon.expiresAt);
        if (expiresAt < new Date()) {
            return {
                isValid: false,
                reason: 'Coupon has expired'
            };
        }

        // Check if active
        if (!coupon.isActive) {
            return {
                isValid: false,
                reason: 'Coupon is not active'
            };
        }

        return { isValid: true };
    }

    // Format discount amount
    formatDiscountAmount(coupon: Coupon, discountAmount: number): string {
        if (coupon.type === 'percentage') {
            return `${coupon.value}% (₹${discountAmount.toFixed(2)})`;
        } else if (coupon.type === 'fixed') {
            return `₹${discountAmount.toFixed(2)}`;
        } else if (coupon.type === 'free_shipping') {
            return 'FREE SHIPPING';
        }
        return `₹${discountAmount.toFixed(2)}`;
    }

    // Get coupon suggestions based on cart
    getCouponSuggestions(cartTotal: number): Array<{ code: string; description: string; discount: string }> {
        return [
            {
                code: 'WELCOME10',
                description: 'Welcome offer - 10% off',
                discount: '10%'
            },
            {
                code: 'FREESHIP',
                description: 'Free shipping on orders over ₹2000',
                discount: 'FREE SHIPPING'
            },
            {
                code: 'SAVE15',
                description: 'Save 15% on orders over ₹3000',
                discount: '15%'
            },
            {
                code: 'NEW20',
                description: '20% off new arrivals',
                discount: '20%'
            }
        ].filter(coupon => {
            // Only show coupons applicable to cart value
            if ((coupon as any).type === 'percentage' && cartTotal >= ((coupon as any).minimumAmount || 0)) {
                return true;
            }
            if ((coupon as any).type === 'fixed' && cartTotal >= ((coupon as any).minimumAmount || 0)) {
                return true;
            }
            if ((coupon as any).type === 'free_shipping' && cartTotal >= 2000) {
                return true;
            }
            return false;
        }).slice(0, 5);
    }
}

// Create singleton instance
export const couponService = new CouponService();

// React hook for coupon management
export const useCoupons = (userId?: string) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            loadUserCoupons();
        }
    }, [userId]);

    const loadUserCoupons = async () => {
        setLoading(true);
        setError(null);

        try {
            const userCoupons = await couponService.getUserCoupons(userId);
            setCoupons(userCoupons);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const validateAndApplyCoupon = async (code: string, cartTotal: number) => {
        setLoading(true);
        setError(null);

        try {
            // First validate the coupon
            const validation = await couponService.validateCoupon(code, cartTotal, userId);
            if (!validation.success) {
                setError(validation.message);
                return null;
            }

            // Then apply the coupon
            const application = await couponService.applyCoupon(code, cartTotal, userId);
            if (!application.success) {
                setError(application.message);
                return null;
            }

            return application.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to apply coupon');
        } finally {
            setLoading(false);
        }
    };

    return {
        coupons,
        loading,
        error,
        validateCoupon: couponService.validateCoupon,
        applyCoupon: couponService.applyCoupon,
        canApplyToCart: couponService.canApplyToCart,
        calculateDiscount: couponService.calculateDiscount,
        formatCouponDescription: couponService.formatCouponDescription,
        formatDiscountAmount: couponService.formatDiscountAmount,
        getCouponByCode: couponService.getCouponByCode,
        getCouponSuggestions: couponService.getCouponSuggestions,
        loadUserCoupons
    };
};

// Export types and service
export default couponService;