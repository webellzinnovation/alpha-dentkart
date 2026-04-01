"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiprocketService = void 0;
class ShiprocketService {
    constructor() {
        this.token = null;
    }
    async authenticate() {
        this.token = 'mock-token';
    }
    validateIndianPincode(pincode) {
        return /^[1-9][0-9]{5}$/.test(pincode);
    }
    async checkPincodeServiceability(pincode) {
        // Mock
        return {
            is_serviceable: true,
            city: 'Unknown City',
            state: 'Unknown State',
            postal_code: pincode,
            service_type: 'COD'
        };
    }
    async getShippingRates(pickupPostcode, deliveryPostcode, weight, cod) {
        // Mock rates
        return [
            {
                courier_name: 'Blue Dart Surface',
                courier_id: 1,
                estimated_delivery_days: 5,
                freight_charge: 50,
                cod_charges: 10,
                total: 60,
                is_surface: true,
                is_reverse: false,
                delivery_eta: '5 days'
            },
            {
                courier_name: 'Delhivery Express',
                courier_id: 2,
                estimated_delivery_days: 2,
                freight_charge: 100,
                cod_charges: 10,
                total: 110,
                is_surface: false,
                is_reverse: false,
                delivery_eta: '2 days'
            }
        ];
    }
    async getEstimatedDelivery(pickupPostcode, deliveryPostcode, weight) {
        return {
            estimated_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            courier_name: 'Blue Dart'
        };
    }
    createOrderRequest(orderData) {
        // Helper to format order data for Shiprocket
        return {
            order_id: orderData.orderId,
            order_date: new Date(),
            pickup_location: 'Primary',
            billing_customer_name: orderData.customerName,
            billing_last_name: '',
            billing_address: orderData.address,
            billing_city: orderData.city,
            billing_pincode: orderData.pincode,
            billing_state: orderData.state,
            billing_country: 'India',
            billing_email: orderData.email,
            billing_phone: orderData.phone,
            shipping_is_billing: true,
            order_items: orderData.items,
            payment_method: orderData.cod ? 'COD' : 'Prepaid',
            sub_total: orderData.subtotal,
            length: 10, width: 10, height: 10, weight: 0.5
        };
    }
    async createOrder(shiprocketOrderData) {
        return {
            status_code: 1,
            message: 'Order created successfully',
            order_id: 12345,
            shipment_id: 67890,
            awb_code: 'AWB123',
            courier_name: 'Blue Dart',
            estimated_delivery: '5 days',
            track_url: 'http://example.com/track'
        };
    }
    async cancelOrder(shiprocketOrderIds) {
        return {
            status_code: 1,
            message: 'Cancelled successfully'
        };
    }
    async trackShipment(awb) {
        return {
            tracking_data: {
                awb_number: awb,
                courier_name: 'Blue Dart',
                current_status: 'In Transit',
                delivered_date: '',
                estimated_delivery: '',
                track_url: '',
                shipment_track: []
            }
        };
    }
    async trackOrder(orderId) {
        return {
            tracking_data: {
                awb_number: 'AWB123',
                courier_name: 'Blue Dart',
                current_status: 'In Transit',
                delivered_date: '',
                estimated_delivery: '',
                track_url: '',
                shipment_track: []
            }
        };
    }
    async getAvailableCouriers(pickupPostcode, deliveryPostcode, weight) {
        return [
            {
                courier_name: 'Blue Dart',
                rate: 100,
                etd: '3 days'
            }
        ];
    }
    async generateAWB(shipmentId) {
        return {
            awb_code: 'AWB123456789',
            courier_company_id: 1,
            courier_name: 'Blue Dart'
        };
    }
    async requestPickup(shipmentId) {
        return {
            pickup_scheduled_date: new Date().toISOString()
        };
    }
    async generateManifest(shipmentId) {
        return { manifest_url: 'http://example.com/manifest.pdf' };
    }
    async printManifest(shipmentId) {
        return { manifest_url: 'http://example.com/manifest.pdf' };
    }
    async generateLabel(shipmentId) {
        return { label_url: 'http://example.com/label.pdf' };
    }
}
exports.ShiprocketService = ShiprocketService;
exports.default = new ShiprocketService();
//# sourceMappingURL=shiprocketService.js.map