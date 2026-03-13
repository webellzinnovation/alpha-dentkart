"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentToken = exports.getPaymentMethodStats = exports.getDefaultPaymentMethod = exports.getPaymentMethodsByGateway = exports.updatePaymentMethod = exports.setDefaultPaymentMethod = exports.deletePaymentMethod = exports.getPaymentMethodById = exports.getUserPaymentMethods = exports.savePaymentMethod = void 0;
const savedPaymentService_1 = __importDefault(require("../services/savedPaymentService"));
const logger_1 = __importDefault(require("../utils/logger"));
const savedPaymentService = new savedPaymentService_1.default();
// Save new payment method
const savePaymentMethod = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { type, gateway, token, last4, brand, expiry, holderName, bankName, upiId, isDefault } = req.body;
        if (!type || !gateway || !token) {
            return res.status(400).json({
                success: false,
                error: 'Type, gateway, and token are required'
            });
        }
        const paymentData = {
            userId,
            type,
            gateway,
            token,
            last4,
            brand,
            expiry,
            holderName,
            bankName,
            upiId,
            isDefault
        };
        const result = await savedPaymentService.savePaymentMethod(paymentData);
        if (result.success) {
            return res.status(201).json({
                success: true,
                message: 'Payment method saved successfully',
                paymentMethod: result.paymentMethod
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
        logger_1.default.error('Error in savePaymentMethod:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.savePaymentMethod = savePaymentMethod;
// Get user payment methods
const getUserPaymentMethods = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const paymentMethods = await savedPaymentService.getUserPaymentMethods(userId);
        return res.status(200).json({
            success: true,
            paymentMethods
        });
    }
    catch (error) {
        logger_1.default.error('Error in getUserPaymentMethods:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getUserPaymentMethods = getUserPaymentMethods;
// Get payment method by ID
const getPaymentMethodById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const paymentId = String(id);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const paymentMethod = await savedPaymentService.getPaymentMethodById(paymentId, userId);
        if (paymentMethod) {
            return res.status(200).json({
                success: true,
                paymentMethod
            });
        }
        else {
            return res.status(404).json({
                success: false,
                error: 'Payment method not found'
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in getPaymentMethodById:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getPaymentMethodById = getPaymentMethodById;
// Delete payment method
const deletePaymentMethod = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const paymentId = String(id);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const result = await savedPaymentService.deletePaymentMethod(paymentId, userId);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Payment method deleted successfully'
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
        logger_1.default.error('Error in deletePaymentMethod:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
// Set default payment method
const setDefaultPaymentMethod = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const paymentId = String(id);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const result = await savedPaymentService.setDefaultPaymentMethod(paymentId, userId);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Default payment method updated successfully',
                paymentMethod: result.paymentMethod
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
        logger_1.default.error('Error in setDefaultPaymentMethod:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.setDefaultPaymentMethod = setDefaultPaymentMethod;
// Update payment method
const updatePaymentMethod = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const paymentId = String(id);
        const updates = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const result = await savedPaymentService.updatePaymentMethod(paymentId, userId, updates);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Payment method updated successfully',
                paymentMethod: result.paymentMethod
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
        logger_1.default.error('Error in updatePaymentMethod:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
// Get payment methods by gateway
const getPaymentMethodsByGateway = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { gateway } = req.params;
        const gatewayStr = String(gateway);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const paymentMethods = await savedPaymentService.getPaymentMethodsByGateway(userId, gatewayStr);
        return res.status(200).json({ success: true, paymentMethods });
    }
    catch (error) {
        logger_1.default.error('Error in getPaymentMethodsByGateway:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
exports.getPaymentMethodsByGateway = getPaymentMethodsByGateway;
// Get default payment method
const getDefaultPaymentMethod = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const paymentMethod = await savedPaymentService.getDefaultPaymentMethod(userId);
        return res.status(200).json({ success: true, paymentMethod });
    }
    catch (error) {
        logger_1.default.error('Error in getDefaultPaymentMethod:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
exports.getDefaultPaymentMethod = getDefaultPaymentMethod;
// Get stats
const getPaymentMethodStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const stats = await savedPaymentService.getPaymentMethodStats(userId);
        return res.status(200).json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.default.error('Error in getPaymentMethodStats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getPaymentMethodStats = getPaymentMethodStats;
// Validate payment token
const validatePaymentToken = async (req, res) => {
    try {
        const { token, gateway } = req.body;
        if (!token || !gateway) {
            return res.status(400).json({ success: false, error: 'Token and gateway are required' });
        }
        const result = await savedPaymentService.validatePaymentToken(token, gateway);
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error('Error in validatePaymentToken:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.validatePaymentToken = validatePaymentToken;
exports.default = {
    savePaymentMethod: exports.savePaymentMethod,
    getUserPaymentMethods: exports.getUserPaymentMethods,
    getPaymentMethodById: exports.getPaymentMethodById,
    deletePaymentMethod: exports.deletePaymentMethod,
    setDefaultPaymentMethod: exports.setDefaultPaymentMethod,
    getDefaultPaymentMethod: exports.getDefaultPaymentMethod,
    updatePaymentMethod: exports.updatePaymentMethod,
    getPaymentMethodsByGateway: exports.getPaymentMethodsByGateway,
    getPaymentMethodStats: exports.getPaymentMethodStats,
    validatePaymentToken: exports.validatePaymentToken
};
//# sourceMappingURL=savedPaymentController.js.map