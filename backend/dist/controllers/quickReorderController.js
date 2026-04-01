"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedReorders = exports.getReorderStats = exports.cancelReorder = exports.getReorderById = exports.getUserReorders = exports.createQuickReorder = void 0;
const quickReorderService_1 = __importDefault(require("../services/quickReorderService"));
const logger_1 = __importDefault(require("../utils/logger"));
const quickReorderService = new quickReorderService_1.default();
// Create quick reorder
const createQuickReorder = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { orderId, notes, modifyQuantities, quantityModifications } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'OrderId is required' });
        }
        const reorderData = {
            userId,
            orderId,
            notes,
            modifyQuantities,
            quantityModifications
        };
        const result = await quickReorderService.createQuickReorder(reorderData);
        if (result.success) {
            return res.status(201).json({
                success: true,
                message: 'Quick reorder created successfully',
                reorder: result.reorder
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
        logger_1.default.error('Error in createQuickReorder:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.createQuickReorder = createQuickReorder;
// Get user reorders
const getUserReorders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { limit = 20, offset = 0, status } = req.query;
        const result = await quickReorderService.getUserReorders(userId, {
            limit: Number(limit),
            offset: Number(offset),
            status: status ? String(status) : undefined
        });
        return res.status(200).json({
            success: true,
            reorders: result.reorders,
            total: result.total
        });
    }
    catch (error) {
        logger_1.default.error('Error in getUserReorders:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getUserReorders = getUserReorders;
// Get reorder details
const getReorderById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const reorderId = String(id);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const reorder = await quickReorderService.getReorderById(reorderId, userId);
        if (reorder) {
            return res.status(200).json({
                success: true,
                reorder
            });
        }
        else {
            return res.status(404).json({
                success: false,
                error: 'Reorder not found'
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in getReorderById:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getReorderById = getReorderById;
// Cancel reorder
const cancelReorder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { reason } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        if (!reason) {
            return res.status(400).json({ success: false, error: 'Cancellation reason is required' });
        }
        const result = await quickReorderService.cancelReorder(String(id), userId, reason);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Reorder cancelled successfully'
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
        logger_1.default.error('Error in cancelReorder:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.cancelReorder = cancelReorder;
// Get stats
const getReorderStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const stats = await quickReorderService.getReorderStats(userId);
        return res.status(200).json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.default.error('Error in getReorderStats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getReorderStats = getReorderStats;
// Get recommended reorders
const getRecommendedReorders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { limit = 5 } = req.query;
        const recommendations = await quickReorderService.getRecommendedReorders(userId, Number(limit));
        return res.status(200).json({
            success: true,
            recommendations
        });
    }
    catch (error) {
        logger_1.default.error('Error in getRecommendedReorders:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getRecommendedReorders = getRecommendedReorders;
exports.default = {
    createQuickReorder: exports.createQuickReorder,
    getUserReorders: exports.getUserReorders,
    getReorderById: exports.getReorderById,
    cancelReorder: exports.cancelReorder,
    getReorderStats: exports.getReorderStats,
    getRecommendedReorders: exports.getRecommendedReorders
};
//# sourceMappingURL=quickReorderController.js.map