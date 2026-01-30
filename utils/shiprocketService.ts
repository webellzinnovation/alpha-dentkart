// Shiprocket API Integration Service for Alpha Dentkart
// Handles shipping calculations, order creation, tracking, and pincode validation

export interface ShiprocketConfig {
  email: string;
  password: string;
  baseURL: string;
  token?: string;
}

export interface ShiprocketAddress {
  name: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

export interface ShiprocketOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  ewaybill_no?: string;
  seller_gstin?: string;
  seller_tin?: string;
}

export interface ShippingRate {
  courier_name: string;
  courier_id: number;
  estimated_delivery_days: string;
  freight_charge: number;
  cod_charges?: number;
  total: number;
  is_surface: boolean;
  is_reverse: boolean;
  pickup_eta?: string;
  delivery_eta?: string;
}

export interface TrackingData {
  tracking_data: {
    awb_number: string;
    courier_name: string;
    current_status: string;
    delivered_date?: string;
    estimated_delivery?: string;
    track_url: string;
    shipment_track: Array<{
      id: number;
      date: string;
      status: string;
      location: string;
      description: string;
    }>;
  };
}

export interface PincodeData {
  is_serviceable: boolean;
  location_code: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  service_type: string;
}

class ShiprocketService {
  private config: ShiprocketConfig;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      email: process.env.SHIPROCKET_EMAIL || '',
      password: process.env.SHIPROCKET_PASSWORD || '',
      baseURL: 'https://apiv2.shiprocket.in/v1/external'
    };
  }

  // Authenticate with Shiprocket API
  private async authenticate(): Promise<void> {
    try {
      // Check if token is still valid (expires after 24 hours)
      if (this.config.token && Date.now() < this.tokenExpiry) {
        return;
      }

      const response = await fetch(`${this.config.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.config.email,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Shiprocket authentication failed');
      }

      const data = await response.json();
      this.config.token = data.token;
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw error;
    }
  }

  // Make authenticated API calls
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.authenticate();
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Shiprocket API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // Check if a pincode is serviceable
  async checkPincodeServiceability(pincode: string): Promise<PincodeData | null> {
    try {
      const response = await this.apiCall(`/courier/serviceability/?pickup_pincode=110001&delivery_pincode=${pincode}&cod=1&weight=0.5`);
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Pincode serviceability check failed:', error);
      return null;
    }
  }

  // Get shipping rates for an order
  async getShippingRates(
    pickupPincode: string = '110001',
    deliveryPincode: string,
    weight: number = 0.5,
    cod: boolean = true
  ): Promise<ShippingRate[]> {
    try {
      const response = await this.apiCall(
        `/courier/getavailabilityandrates?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&cod=${cod ? 1 : 0}&weight=${weight}`
      );

      return response.data || [];
    } catch (error) {
      console.error('Shipping rates fetch failed:', error);
      return [];
    }
  }

  // Create an order in Shiprocket
  async createOrder(orderData: ShiprocketOrderRequest): Promise<any> {
    try {
      const response = await this.apiCall('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      return response;
    } catch (error) {
      console.error('Shiprocket order creation failed:', error);
      throw error;
    }
  }

  // Track a shipment
  async trackShipment(awbNumber: string): Promise<TrackingData | null> {
    try {
      const response = await this.apiCall(`/courier/track/awb/${awbNumber}`);
      return response;
    } catch (error) {
      console.error('Shipment tracking failed:', error);
      return null;
    }
  }

  // Track order by order ID
  async trackOrder(orderId: string): Promise<TrackingData | null> {
    try {
      const response = await this.apiCall(`/orders/track/${orderId}`);
      return response;
    } catch (error) {
      console.error('Order tracking failed:', error);
      return null;
    }
  }

  // Cancel an order
  async cancelOrder(orderIds: string[]): Promise<any> {
    try {
      const response = await this.apiCall('/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ ids: orderIds }),
      });

      return response;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      throw error;
    }
  }

  // Get available couriers for a route
  async getAvailableCouriers(pickupPincode: string, deliveryPincode: string, weight: number = 0.5): Promise<any[]> {
    try {
      const response = await this.apiCall(
        `/courier/serviceability/?pickup_pincode=${pickupPincode}&delivery_pincode=${deliveryPincode}&cod=1&weight=${weight}`
      );

      return response.data || [];
    } catch (error) {
      console.error('Available couriers fetch failed:', error);
      return [];
    }
  }

  // Calculate estimated delivery date
  async getEstimatedDelivery(
    pickupPincode: string = '110001',
    deliveryPincode: string,
    weight: number = 0.5
  ): Promise<{ minDays: number; maxDays: number; date: string } | null> {
    try {
      const rates = await this.getShippingRates(pickupPincode, deliveryPincode, weight);
      
      if (rates.length === 0) return null;

      // Find minimum and maximum delivery days
      const deliveryTimes = rates.map(rate => {
        const daysText = rate.estimated_delivery_days;
        const days = parseInt(daysText) || 0;
        return days;
      });

      const minDays = Math.min(...deliveryTimes);
      const maxDays = Math.max(...deliveryTimes);
      
      // Calculate estimated delivery date
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + minDays);

      return {
        minDays,
        maxDays,
        date: deliveryDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };
    } catch (error) {
      console.error('Delivery estimation failed:', error);
      return null;
    }
  }

  // Convert order items to Shiprocket format
  convertToShiprocketItems(items: Array<{
    name: string;
    id: string;
    quantity: number;
    price: number;
    weight?: number;
  }>): ShiprocketOrderItem[] {
    return items.map(item => ({
      name: item.name,
      sku: item.id,
      units: item.quantity,
      selling_price: item.price,
      weight: item.weight || 0.5,
    }));
  }

  // Create order request from Alpha Dentkart order
  createOrderRequest(order: {
    id: string;
    items: Array<any>;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: ShiprocketAddress;
    };
    total: number;
    shippingCharges: number;
    paymentMethod: string;
  }): ShiprocketOrderRequest {
    const { customerInfo } = order;
    const billingAddress = customerInfo.address;

    return {
      order_id: order.id,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'Primary',
      channel_id: 'ALPHA_DENTKART',
      comment: 'Dental supplies order',
      billing_customer_name: customerInfo.name,
      billing_last_name: '',
      billing_address: billingAddress.address,
      billing_address_2: billingAddress.address_2 || '',
      billing_city: billingAddress.city,
      billing_pincode: billingAddress.pincode,
      billing_state: billingAddress.state,
      billing_country: billingAddress.country,
      billing_email: customerInfo.email,
      billing_phone: customerInfo.phone,
      shipping_is_billing: true,
      order_items: this.convertToShiprocketItems(order.items),
      payment_method: order.paymentMethod,
      shipping_charges: order.shippingCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total,
      length: 10,
      breadth: 8,
      height: 5,
      weight: 0.5,
    };
  }

  // Validate Indian pincode format
  validateIndianPincode(pincode: string): boolean {
    // Indian pincodes are 6 digits
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  // Format phone number for Shiprocket
  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Remove leading 0 or 91
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Return 10-digit phone number
    return cleanPhone.length === 10 ? cleanPhone : phone;
  }
}

// Create singleton instance
export const shiprocketService = new ShiprocketService();

// Export types and service
export default shiprocketService;

// Utility functions for frontend
export const shippingUtils = {
  formatShippingDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatShippingRate: (rate: number): string => {
    return `₹${rate.toFixed(2)}`;
  },

  getDeliveryMessage: (minDays: number, maxDays: number): string => {
    if (minDays === maxDays) {
      return `Estimated delivery in ${minDays} day${minDays > 1 ? 's' : ''}`;
    }
    return `Estimated delivery in ${minDays}-${maxDays} days`;
  },

  isSameDayDelivery: (pincode: string): boolean => {
    // Logic to check if same-day delivery is available for the pincode
    // This would typically involve checking specific metro pincodes
    const sameDayPincodes = ['110001', '110002', '110003', '110004', '110005']; // Example Delhi pincodes
    return sameDayPincodes.includes(pincode);
  }
};