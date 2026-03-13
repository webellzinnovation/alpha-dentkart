"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartDeliveryEstimate = exports.getShippingCost = exports.checkPincodeServiceability = exports.getDeliveryAnalytics = exports.getDeliveryHistory = exports.calculateDeliveryEstimation = void 0;
const deliveryEstimationService_1 = __importDefault(require("../services/deliveryEstimationService"));
const logger_1 = __importDefault(require("../utils/logger"));
// No Prisma Client
const deliveryEstimationService = new deliveryEstimationService_1.default();
// Calculate delivery estimation
const calculateDeliveryEstimation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { pincode, items, shippingMethod = 'standard', address } = req.body;
        // Validate required fields
        if (!pincode || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Pincode and items are required'
            });
        }
        // Validate pincode format (6 digits)
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pincode format. Must be 6 digits'
            });
        }
        // Validate items
        for (const [index, item] of items.entries()) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid item at index ${index}: productId and quantity are required`
                });
            }
            if (item.quantity > 100) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid item at index ${index}: quantity cannot exceed 100`
                });
            }
            // Validate dimensions if provided
            if (item.dimensions) {
                const { length, width, height } = item.dimensions;
                if (!length || !width || !height ||
                    length <= 0 || width <= 0 || height <= 0 ||
                    length > 200 || width > 200 || height > 200) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid dimensions for item at index ${index}: All dimensions must be positive and not exceed 200cm`
                    });
                }
            }
        }
        // Validate shipping method
        const validMethods = ['standard', 'express', 'overnight'];
        if (!validMethods.includes(shippingMethod)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipping method. Must be standard, express, or overnight'
            });
        }
        const estimationRequest = {
            userId,
            pincode,
            items,
            shippingMethod: shippingMethod,
            address
        };
        const result = await deliveryEstimationService.calculateDeliveryEstimation(estimationRequest);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Delivery estimation calculated successfully',
                estimation: result.estimation
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in calculateDeliveryEstimation:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.calculateDeliveryEstimation = calculateDeliveryEstimation;
// Get delivery history for user
const getDeliveryHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { limit = 10 } = req.query;
        const history = await deliveryEstimationService.getDeliveryHistory(userId, parseInt(limit));
        return res.status(200).json({
            success: true,
            history
        });
    }
    catch (error) {
        logger_1.default.error('Error in getDeliveryHistory:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getDeliveryHistory = getDeliveryHistory;
// Get delivery analytics
const getDeliveryAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const analytics = await deliveryEstimationService.getDeliveryAnalytics(userId);
        return res.status(200).json({
            success: true,
            analytics
        });
    }
    catch (error) {
        logger_1.default.error('Error in getDeliveryAnalytics:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getDeliveryAnalytics = getDeliveryAnalytics;
// Check pincode serviceability
const checkPincodeServiceability = async (req, res) => {
    try {
        const { pincode } = req.body;
        if (!pincode) {
            return res.status(400).json({
                success: false,
                error: 'Pincode is required'
            });
        }
        // Mock pincode serviceability check
        const serviceabilityResult = await deliveryEstimationService.calculateDeliveryEstimation({
            pincode,
            items: [{
                    productId: 'mock',
                    quantity: 1
                }]
        });
        if (serviceabilityResult.success && serviceabilityResult.estimation) {
            const { pincode: pincodeData } = serviceabilityResult.estimation;
            return res.status(200).json({
                success: true,
                serviceable: pincodeData.serviceable,
                pincode: {
                    pincode,
                    city: pincodeData.city,
                    state: pincodeData.state,
                    deliveryDays: pincodeData.deliveryDays,
                    codAvailable: pincodeData.codAvailable,
                    estimatedCost: {
                        standard: 100,
                        express: 150,
                        overnight: 200
                    }
                }
            });
        }
        else {
            return res.status(200).json({
                success: true,
                serviceable: false,
                pincode,
                error: 'Pincode not serviceable'
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in checkPincodeServiceability:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.checkPincodeServiceability = checkPincodeServiceability;
// Get shipping cost calculator
const getShippingCost = async (req, res) => {
    try {
        const { pincode, items, shippingMethod = 'standard' } = req.body;
        if (!pincode || !items) {
            return res.status(400).json({
                success: false,
                error: 'Pincode and items are required'
            });
        }
        const result = await deliveryEstimationService.calculateDeliveryEstimation({
            pincode,
            items,
            shippingMethod: shippingMethod
        });
        if (result.success && result.estimation) {
            return res.status(200).json({
                success: true,
                shippingOptions: result.estimation.shippingOptions,
                pincode: result.estimation.pincode,
                totalWeight: result.estimation.shippingOptions.reduce((sum, opt) => sum + (opt.cost / 20), 0 // Approximate weight from cost
                ),
                totalDimensions: {
                    length: 100, // Mock calculation
                    width: 100,
                    height: 50,
                    volumetricWeight: 100
                }
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in getShippingCost:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getShippingCost = getShippingCost;
// Get estimated delivery date for cart (helper endpoint)
const getCartDeliveryEstimate = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { pincode, shippingMethod = 'standard' } = req.body;
        if (!pincode) {
            return res.status(400).json({
                success: false,
                error: 'Pincode is required'
            });
        }
        // Get user's cart items (mock implementation)
        // In a real app, this would fetch from cart table
        const cartItems = [
            {
                productId: 'prod1',
                quantity: 2,
                weight: 0.5
            },
            {
                productId: 'prod2',
                quantity: 1,
                weight: 1.0,
                dimensions: {
                    length: 20,
                    width: 15,
                    height: 10
                }
            }
        ];
        const result = await deliveryEstimationService.calculateDeliveryEstimation({
            userId,
            pincode,
            items: cartItems,
            shippingMethod: shippingMethod
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                cartEstimate: result.estimation,
                cartSummary: {
                    itemCount: cartItems.length,
                    totalWeight: cartItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0),
                    estimatedDate: result.estimation?.deliveryDate,
                    shippingOptions: result.estimation?.shippingOptions || []
                }
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in getCartDeliveryEstimate:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getCartDeliveryEstimate = getCartDeliveryEstimate;
exports.default = {
    calculateDeliveryEstimation: exports.calculateDeliveryEstimation,
    getDeliveryHistory: exports.getDeliveryHistory,
    getDeliveryAnalytics: exports.getDeliveryAnalytics,
    checkPincodeServiceability: exports.checkPincodeServiceability,
    getShippingCost: exports.getShippingCost,
    getCartDeliveryEstimate: exports.getCartDeliveryEstimate
};
//# sourceMappingURL=deliveryEstimationController.js.map