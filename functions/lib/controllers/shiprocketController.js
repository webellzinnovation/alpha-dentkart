"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateShippingCharges = exports.getAvailableCouriers = exports.cancelShiprocketOrder = exports.trackShipment = exports.createShiprocketOrder = exports.getEstimatedDelivery = exports.getShippingRates = exports.checkPincodeServiceability = void 0;
const shiprocketService_1 = __importDefault(require("../services/shiprocketService"));
const logger_1 = __importDefault(require("../utils/logger"));
// Check if a pincode is serviceable
const checkPincodeServiceability = async (req, res) => {
    try {
        const { pincode } = req.body;
        if (!pincode) {
            return res.status(400).json({
                success: false,
                message: 'Pincode is required'
            });
        }
        // Validate pincode format
        if (!shiprocketService_1.default.validateIndianPincode(pincode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Indian pincode format'
            });
        }
        const serviceability = await shiprocketService_1.default.checkPincodeServiceability(pincode);
        if (!serviceability) {
            return res.json({
                success: false,
                message: 'Pincode not serviceable',
                isServiceable: false
            });
        }
        res.json({
            success: true,
            message: 'Pincode is serviceable',
            data: {
                isServiceable: serviceability.is_serviceable,
                city: serviceability.city,
                state: serviceability.state,
                postal_code: serviceability.postal_code,
                service_type: serviceability.service_type
            }
        });
    }
    catch (error) {
        logger_1.default.error('Pincode serviceability check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check pincode serviceability',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.checkPincodeServiceability = checkPincodeServiceability;
// Get shipping rates for a pincode
const getShippingRates = async (req, res) => {
    try {
        const { deliveryPincode, weight = 0.5, cod = true, pickupPincode = '110001' } = req.body;
        if (!deliveryPincode) {
            return res.status(400).json({
                success: false,
                message: 'Delivery pincode is required'
            });
        }
        const rates = await shiprocketService_1.default.getShippingRates(pickupPincode, deliveryPincode, weight, cod);
        if (rates.length === 0) {
            return res.json({
                success: false,
                message: 'No shipping rates available for this pincode',
                data: []
            });
        }
        // Filter and sort rates (prefer surface shipping for cost-effectiveness)
        const sortedRates = rates
            .filter(rate => !rate.is_reverse) // Exclude reverse pickup
            .sort((a, b) => a.total - b.total); // Sort by cost
        res.json({
            success: true,
            message: 'Shipping rates fetched successfully',
            data: sortedRates.map(rate => ({
                courierName: rate.courier_name,
                courierId: rate.courier_id,
                estimatedDays: rate.estimated_delivery_days,
                freightCharge: rate.freight_charge,
                codCharges: rate.cod_charges || 0,
                total: rate.total,
                isSurface: rate.is_surface,
                deliveryEta: rate.delivery_eta
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Shipping rates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipping rates',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getShippingRates = getShippingRates;
// Get estimated delivery date
const getEstimatedDelivery = async (req, res) => {
    try {
        const { deliveryPincode, weight = 0.5, pickupPincode = '110001' } = req.body;
        if (!deliveryPincode) {
            return res.status(400).json({
                success: false,
                message: 'Delivery pincode is required'
            });
        }
        const estimation = await shiprocketService_1.default.getEstimatedDelivery(pickupPincode, deliveryPincode, weight);
        if (!estimation) {
            return res.json({
                success: false,
                message: 'Unable to estimate delivery date',
                data: null
            });
        }
        res.json({
            success: true,
            message: 'Delivery estimation fetched successfully',
            data: estimation
        });
    }
    catch (error) {
        logger_1.default.error('Delivery estimation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to estimate delivery date',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getEstimatedDelivery = getEstimatedDelivery;
// Create order in Shiprocket
const createShiprocketOrder = async (req, res) => {
    try {
        const { orderData } = req.body;
        if (!orderData) {
            return res.status(400).json({
                success: false,
                message: 'Order data is required'
            });
        }
        // Convert to Shiprocket format
        const shiprocketOrderData = shiprocketService_1.default.createOrderRequest(orderData);
        // Create order in Shiprocket
        const response = await shiprocketService_1.default.createOrder(shiprocketOrderData);
        if (response.status_code !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create order in Shiprocket',
                error: response.message || 'Unknown error'
            });
        }
        res.json({
            success: true,
            message: 'Order created successfully in Shiprocket',
            data: {
                orderId: response.order_id,
                shipmentId: response.shipment_id,
                awbNumber: response.awb_code,
                courierName: response.courier_name,
                estimatedDelivery: response.estimated_delivery,
                trackingUrl: response.track_url
            }
        });
    }
    catch (error) {
        logger_1.default.error('Shiprocket order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order in Shiprocket',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createShiprocketOrder = createShiprocketOrder;
// Track shipment
const trackShipment = async (req, res) => {
    try {
        const { awbNumber, orderId } = req.body;
        let trackingData;
        if (awbNumber) {
            trackingData = await shiprocketService_1.default.trackShipment(awbNumber);
        }
        else if (orderId) {
            trackingData = await shiprocketService_1.default.trackOrder(orderId);
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Either AWB number or Order ID is required'
            });
        }
        if (!trackingData) {
            return res.json({
                success: false,
                message: 'Tracking information not found',
                data: null
            });
        }
        const tracking = trackingData.tracking_data;
        res.json({
            success: true,
            message: 'Tracking information fetched successfully',
            data: {
                awbNumber: tracking.awb_number,
                courierName: tracking.courier_name,
                currentStatus: tracking.current_status,
                deliveredDate: tracking.delivered_date,
                estimatedDelivery: tracking.estimated_delivery,
                trackUrl: tracking.track_url,
                shipmentTrack: tracking.shipment_track.map((track) => ({
                    id: track.id,
                    date: track.date,
                    status: track.status,
                    location: track.location,
                    description: track.description
                }))
            }
        });
    }
    catch (error) {
        logger_1.default.error('Shipment tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track shipment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.trackShipment = trackShipment;
// Cancel order
const cancelShiprocketOrder = async (req, res) => {
    try {
        const { orderIds } = req.body;
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order IDs array is required'
            });
        }
        const response = await shiprocketService_1.default.cancelOrder(orderIds);
        if (response.status_code !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Failed to cancel order',
                error: response.message || 'Unknown error'
            });
        }
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: response
        });
    }
    catch (error) {
        logger_1.default.error('Order cancellation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.cancelShiprocketOrder = cancelShiprocketOrder;
// Get available couriers for a route
const getAvailableCouriers = async (req, res) => {
    try {
        const { deliveryPincode, weight = 0.5, pickupPincode = '110001' } = req.body;
        if (!deliveryPincode) {
            return res.status(400).json({
                success: false,
                message: 'Delivery pincode is required'
            });
        }
        const couriers = await shiprocketService_1.default.getAvailableCouriers(pickupPincode, deliveryPincode, weight);
        res.json({
            success: true,
            message: 'Available couriers fetched successfully',
            data: couriers
        });
    }
    catch (error) {
        logger_1.default.error('Available couriers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available couriers',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAvailableCouriers = getAvailableCouriers;
// Calculate shipping charges based on order weight and destination
const calculateShippingCharges = async (req, res) => {
    try {
        const { deliveryPincode, cartTotal, weight = 0.5 } = req.body;
        if (!deliveryPincode) {
            return res.status(400).json({
                success: false,
                message: 'Delivery pincode is required'
            });
        }
        // Check if free shipping applies
        const freeShippingThreshold = 5000; // ₹5000 for free shipping
        const isFreeShipping = cartTotal >= freeShippingThreshold;
        if (isFreeShipping) {
            return res.json({
                success: true,
                message: 'Free shipping applied',
                data: {
                    shippingCharges: 0,
                    codCharges: 0,
                    totalCharges: 0,
                    freeShipping: true,
                    threshold: freeShippingThreshold
                }
            });
        }
        // Get shipping rates
        const rates = await shiprocketService_1.default.getShippingRates('110001', deliveryPincode, weight, true);
        if (rates.length === 0) {
            return res.json({
                success: false,
                message: 'No shipping available for this pincode',
                data: null
            });
        }
        // Get the cheapest surface shipping
        const cheapestRate = rates
            .filter(rate => rate.is_surface && !rate.is_reverse)
            .sort((a, b) => a.total - b.total)[0];
        if (!cheapestRate) {
            // Fallback to any available rate
            const anyRate = rates.sort((a, b) => a.total - b.total)[0];
            return res.json({
                success: true,
                message: 'Shipping charges calculated',
                data: {
                    shippingCharges: anyRate.freight_charge,
                    codCharges: anyRate.cod_charges || 0,
                    totalCharges: anyRate.total,
                    freeShipping: false,
                    threshold: freeShippingThreshold,
                    courierName: anyRate.courier_name,
                    estimatedDays: anyRate.estimated_delivery_days
                }
            });
        }
        res.json({
            success: true,
            message: 'Shipping charges calculated',
            data: {
                shippingCharges: cheapestRate.freight_charge,
                codCharges: cheapestRate.cod_charges || 0,
                totalCharges: cheapestRate.total,
                freeShipping: false,
                threshold: freeShippingThreshold,
                courierName: cheapestRate.courier_name,
                estimatedDays: cheapestRate.estimated_delivery_days
            }
        });
    }
    catch (error) {
        logger_1.default.error('Shipping calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate shipping charges',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.calculateShippingCharges = calculateShippingCharges;
//# sourceMappingURL=shiprocketController.js.map