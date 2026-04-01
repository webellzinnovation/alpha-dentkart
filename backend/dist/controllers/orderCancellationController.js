"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderForCancellation = exports.getOrderCancellationHistory = exports.getCancellationReasons = exports.bulkCancelOrders = exports.cancelOrder = void 0;
const firebase_1 = require("../config/firebase");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Validation schemas
const cancelOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).max(500),
    comments: zod_1.z.string().optional()
});
const bulkCancelSchema = zod_1.z.object({
    orderIds: zod_1.z.array(zod_1.z.string()),
    reason: zod_1.z.string().min(3).max(500)
});
// Cancel a single order
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const validation = cancelOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error });
        }
        const { reason, comments } = validation.data;
        // Fetch order
        const orderRef = firebase_1.db.collection('orders').doc(String(orderId));
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderDoc.data();
        if (order.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
        }
        // Logic to allow cancellation only if not shipped (simplified)
        if (order.status === 'shipped' || order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel shipped/delivered order' });
        }
        // Update order status
        await orderRef.update({
            status: 'cancelled',
            cancellationReason: reason,
            cancellationComments: comments,
            cancelledAt: new Date().toISOString()
        });
        // Add to return requests/transactions if refund needed?
        // Basic implementation: just log it in return_requests as a cancellation type?
        await firebase_1.db.collection('return_requests').add({
            id: (0, uuid_1.v4)(),
            orderId,
            userId,
            reason,
            comments,
            type: 'cancellation',
            status: 'approved', // Auto approved for simple cancellation
            createdAt: new Date().toISOString()
        });
        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};
exports.cancelOrder = cancelOrder;
// Bulk cancel orders
const bulkCancelOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const validation = bulkCancelSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error });
        }
        const { orderIds, reason } = validation.data;
        const results = [];
        for (const orderId of orderIds) {
            try {
                const orderRef = firebase_1.db.collection('orders').doc(String(orderId));
                const orderDoc = await orderRef.get();
                if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
                    results.push({ orderId, success: false, error: 'Not found or unauthorized' });
                    continue;
                }
                const order = orderDoc.data();
                if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
                    results.push({ orderId, success: false, error: 'Cannot cancel order in current status' });
                    continue;
                }
                await orderRef.update({
                    status: 'cancelled',
                    cancellationReason: reason,
                    cancelledAt: new Date().toISOString()
                });
                results.push({ orderId, success: true });
            }
            catch (err) {
                results.push({ orderId, success: false, error: 'Internal error' });
            }
        }
        return res.status(200).json({ success: true, results });
    }
    catch (error) {
        logger_1.default.error('Bulk cancel error:', error);
        res.status(500).json({ success: false, message: 'Failed to process bulk cancellation' });
    }
};
exports.bulkCancelOrders = bulkCancelOrders;
// Get cancellation reasons
const getCancellationReasons = async (req, res) => {
    try {
        const reasons = [
            'Found a better price elsewhere',
            'Order created by mistake',
            'Need to change shipping address',
            'Need to change payment method',
            'Estimated delivery time is too long',
            'Other'
        ];
        res.json({ success: true, reasons });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reasons' });
    }
};
exports.getCancellationReasons = getCancellationReasons;
// Get order cancellation history
const getOrderCancellationHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const snapshot = await firebase_1.db.collection('return_requests')
            .where('userId', '==', userId)
            .where('type', '==', 'cancellation')
            .orderBy('createdAt', 'desc')
            .get();
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};
exports.getOrderCancellationHistory = getOrderCancellationHistory;
// Check order eligibility for cancellation
const getOrderForCancellation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const orderDoc = await firebase_1.db.collection('orders').doc(String(orderId)).get();
        if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderDoc.data();
        const isEligible = !['shipped', 'delivered', 'cancelled'].includes(order.status);
        res.json({
            success: true,
            eligible: isEligible,
            order: {
                id: orderDoc.id,
                status: order.status,
                total: order.total
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check eligibility' });
    }
};
exports.getOrderForCancellation = getOrderForCancellation;
exports.default = {
    cancelOrder: exports.cancelOrder,
    bulkCancelOrders: exports.bulkCancelOrders,
    getCancellationReasons: exports.getCancellationReasons,
    getOrderCancellationHistory: exports.getOrderCancellationHistory,
    getOrderForCancellation: exports.getOrderForCancellation
};
//# sourceMappingURL=orderCancellationController.js.map