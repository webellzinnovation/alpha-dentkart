import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db, admin } from '../config/firebase';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import logger from '../utils/logger';

// Validation schemas
const cancelOrderSchema = z.object({
    reason: z.string().min(3).max(500),
    comments: z.string().optional()
});

const bulkCancelSchema = z.object({
    orderIds: z.array(z.string()),
    reason: z.string().min(3).max(500)
});

// Cancel a single order
export const cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;

        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const validation = cancelOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error });
        }
        const { reason, comments } = validation.data;

        // Fetch order
        const orderRef = db.collection('orders').doc(String(orderId));
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orderDoc.data() as any;
        if (order.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
        }

        // Logic to allow cancellation only if not shipped (simplified)
        if (order.status === 'shipped' || order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel shipped/delivered order' });
        }

        // Update order status
        await orderRef.update({
            status: 'Cancelled',
            cancellationReason: reason,
            cancellationComments: comments,
            cancelledAt: new Date().toISOString(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
                status: 'Cancelled',
                timestamp: new Date().toISOString(),
                note: `Order cancelled. Reason: ${reason}. ${comments ? 'Comments: ' + comments : ''}`
            })
        });

        // Add to return requests/transactions if refund needed?
        // Basic implementation: just log it in return_requests as a cancellation type?
        await db.collection('return_requests').add({
            id: randomUUID(),
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

    } catch (error) {
        logger.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};

// Bulk cancel orders
export const bulkCancelOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const validation = bulkCancelSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error });
        }

        const { orderIds, reason } = validation.data;
        const results = [];

        for (const orderId of orderIds) {
            try {
                const orderRef = db.collection('orders').doc(String(orderId));
                const orderDoc = await orderRef.get();

                if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
                    results.push({ orderId, success: false, error: 'Not found or unauthorized' });
                    continue;
                }

                const order = orderDoc.data() as any;
                if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
                    results.push({ orderId, success: false, error: 'Cannot cancel order in current status' });
                    continue;
                }

                await orderRef.update({
                    status: 'Cancelled',
                    cancellationReason: reason,
                    cancelledAt: new Date().toISOString(),
                    statusHistory: admin.firestore.FieldValue.arrayUnion({
                        status: 'Cancelled',
                        timestamp: new Date().toISOString(),
                        note: `Order cancelled in bulk. Reason: ${reason}`
                    })
                });

                results.push({ orderId, success: true });

            } catch (err) {
                results.push({ orderId, success: false, error: 'Internal error' });
            }
        }

        return res.status(200).json({ success: true, results });

    } catch (error) {
        logger.error('Bulk cancel error:', error);
        res.status(500).json({ success: false, message: 'Failed to process bulk cancellation' });
    }
};

// Get cancellation reasons
export const getCancellationReasons = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reasons' });
    }
};

// Get order cancellation history
export const getOrderCancellationHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const snapshot = await db.collection('return_requests')
            .where('userId', '==', userId)
            .where('type', '==', 'cancellation')
            .orderBy('createdAt', 'desc')
            .get();

        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};

// Check order eligibility for cancellation
export const getOrderForCancellation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;

        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const orderDoc = await db.collection('orders').doc(String(orderId)).get();
        if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orderDoc.data() as any;
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
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check eligibility' });
    }
};

export default {
    cancelOrder,
    bulkCancelOrders,
    getCancellationReasons,
    getOrderCancellationHistory,
    getOrderForCancellation
};