// Frontend Shiprocket Service for Alpha Dentkart
// Handles shipping calculations, pincode validation, and tracking

export interface PincodeValidation {
  success: boolean;
  message: string;
  isServiceable?: boolean;
  city?: string;
  state?: string;
  postal_code?: string;
  service_type?: string;
}

export interface ShippingRate {
  courierName: string;
  courierId: number;
  estimatedDays: string;
  freightCharge: number;
  codCharges: number;
  total: number;
  isSurface: boolean;
  deliveryEta?: string;
}

export interface ShippingRatesResponse {
  success: boolean;
  message: string;
  data: ShippingRate[];
}

export interface DeliveryEstimation {
  minDays: number;
  maxDays: number;
  date: string;
}

export interface TrackingInfo {
  awbNumber: string;
  courierName: string;
  currentStatus: string;
  deliveredDate?: string;
  estimatedDelivery?: string;
  trackUrl: string;
  shipmentTrack: Array<{
    id: number;
    date: string;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface ShippingCalculation {
  shippingCharges: number;
  codCharges: number;
  totalCharges: number;
  freeShipping: boolean;
  threshold: number;
  courierName?: string;
  estimatedDays?: string;
}

class ShiprocketAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  // API helper method
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}/api/shiprocket${endpoint}`;
    
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

  // Check if pincode is serviceable
  async checkPincodeServiceability(pincode: string): Promise<PincodeValidation> {
    try {
      return await this.apiCall('/check-pincode', {
        method: 'POST',
        body: JSON.stringify({ pincode }),
      });
    } catch (error) {
      console.error('Pincode validation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to validate pincode'
      };
    }
  }

  // Get shipping rates for delivery
  async getShippingRates(
    deliveryPincode: string,
    weight: number = 0.5,
    cod: boolean = true,
    pickupPincode: string = '110001'
  ): Promise<ShippingRatesResponse> {
    try {
      return await this.apiCall('/get-rates', {
        method: 'POST',
        body: JSON.stringify({
          deliveryPincode,
          weight,
          cod,
          pickupPincode,
        }),
      });
    } catch (error) {
      console.error('Shipping rates error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shipping rates',
        data: []
      };
    }
  }

  // Get estimated delivery date
  async getEstimatedDelivery(
    deliveryPincode: string,
    weight: number = 0.5,
    pickupPincode: string = '110001'
  ): Promise<{ success: boolean; message: string; data: DeliveryEstimation | null }> {
    try {
      return await this.apiCall('/estimate-delivery', {
        method: 'POST',
        body: JSON.stringify({
          deliveryPincode,
          weight,
          pickupPincode,
        }),
      });
    } catch (error) {
      console.error('Delivery estimation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to estimate delivery',
        data: null
      };
    }
  }

  // Calculate shipping charges for cart
  async calculateShippingCharges(
    deliveryPincode: string,
    cartTotal: number,
    weight: number = 0.5
  ): Promise<{ success: boolean; message: string; data: ShippingCalculation | null }> {
    try {
      return await this.apiCall('/calculate-charges', {
        method: 'POST',
        body: JSON.stringify({
          deliveryPincode,
          cartTotal,
          weight,
        }),
      });
    } catch (error) {
      console.error('Shipping calculation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate shipping',
        data: null
      };
    }
  }

  // Track shipment using AWB number (requires auth)
  async trackShipment(awbNumber: string, token?: string): Promise<{ success: boolean; message: string; data: TrackingInfo | null }> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return await this.apiCall('/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({ awbNumber }),
      });
    } catch (error) {
      console.error('Shipment tracking error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to track shipment',
        data: null
      };
    }
  }

  // Track order using order ID (requires auth)
  async trackOrder(orderId: string, token?: string): Promise<{ success: boolean; message: string; data: TrackingInfo | null }> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return await this.apiCall('/track-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId }),
      });
    } catch (error) {
      console.error('Order tracking error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to track order',
        data: null
      };
    }
  }

  // Get available couriers for route
  async getAvailableCouriers(
    deliveryPincode: string,
    weight: number = 0.5,
    pickupPincode: string = '110001'
  ): Promise<any> {
    try {
      return await this.apiCall('/available-couriers', {
        method: 'POST',
        body: JSON.stringify({
          deliveryPincode,
          weight,
          pickupPincode,
        }),
      });
    } catch (error) {
      console.error('Available couriers error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch available couriers',
        data: []
      };
    }
  }

  // Create order in Shiprocket (requires auth)
  async createOrder(orderData: any, token: string): Promise<any> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      return await this.apiCall('/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderData }),
      });
    } catch (error) {
      console.error('Order creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  // Cancel order (requires auth)
  async cancelOrder(orderIds: string[], token: string): Promise<any> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      return await this.apiCall('/cancel', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderIds }),
      });
    } catch (error) {
      console.error('Order cancellation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel order'
      };
    }
  }

  // Utility methods
  validateIndianPincode(pincode: string): boolean {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  formatShippingRate(rate: ShippingRate): string {
    return `₹${rate.total.toFixed(2)}`;
  }

  formatDeliveryMessage(minDays: number, maxDays: number): string {
    if (minDays === maxDays) {
      return `Estimated delivery in ${minDays} day${minDays > 1 ? 's' : ''}`;
    }
    return `Estimated delivery in ${minDays}-${maxDays} days`;
  }

  isSameDayDelivery(pincode: string): boolean {
    // Major metro pincodes for same-day delivery
    const sameDayPincodes = [
      '110001', '110002', '110003', '110004', '110005', // Delhi
      '400001', '400002', '400003', '400004', '400005', // Mumbai
      '600001', '600002', '600003', '600004', '600005', // Chennai
      '560001', '560002', '560003', '560004', '560005', // Bangalore
    ];
    return sameDayPincodes.includes(pincode);
  }

  getFreeShippingMessage(cartTotal: number, freeShippingThreshold: number = 5000): string {
    if (cartTotal >= freeShippingThreshold) {
      return '✅ Free shipping applied!';
    }
    const remaining = freeShippingThreshold - cartTotal;
    return `Add ₹${remaining.toFixed(2)} more for free shipping`;
  }
}

// Create singleton instance
export const shiprocketAPI = new ShiprocketAPIService();

// React hook for shipping calculations
import { useState } from 'react';

export const useShippingCalculation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateShipping = async (pincode: string, cartTotal: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await shiprocketAPI.calculateShippingCharges(pincode, cartTotal);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate shipping');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calculateShipping, loading, error };
};

// Export types and service
export default shiprocketAPI;