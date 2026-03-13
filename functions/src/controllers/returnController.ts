import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import { z } from 'zod';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string; // Firebase UID
        role: string;
        userType: string;
    };
}

// Validation schemas (Updated for String IDs)
const createReturnRequestSchema = z.object({
    orderId: z.string(),
    orderItemId: z.string().or(z.number().transform(String)), // Item ID might vary
    reason: z.enum(['damaged', 'wrong-item', 'not-as-described', 'expired', 'size-issue', 'other']),
    condition: z.enum(['new', 'used', 'damaged']),
    description: z.string().min(10).max(500),
    images: z.array(z.string()).optional(),
    refundType: z.enum(['refund', 'replacement', 'exchange']),
    refundAmount: z.number().optional(),
    trackingId: z.string().optional()
});

const updateReturnRequestSchema = z.object({
    // Same as before...
    status: z.enum(['pending', 'approved', 'rejected', 'completed']).optional()
});

const createRefundSchema = z.object({
    returnId: z.string(),
    paymentId: z.string(),
    amount: z.number(),
    gateway: z.enum(['razorpay', 'phonepe', 'bank']),
    gatewayId: z.string().optional(),
    failureReason: z.string().optional()
});

// Create return request
export async function createReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const validatedData = createReturnRequestSchema.parse(req.body);

        // Check if order belongs to user
        const orderDoc = await db.collection('orders').doc(String(validatedData.orderId)).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderDoc.data() as any;

        if (order.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to order' });
        }

        // Check return window
        const deliveryDate = new Date(order.createdAt); // Simplified: Using createdAt as proxy if delivery date missing
        const now = new Date();
        const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
        const maxReturnDays = req.user?.userType === 'dental-doctor' ? 30 : 15;

        if (daysSinceDelivery > maxReturnDays) {
            return res.status(400).json({
                error: 'Return window expired',
                message: `Returns must be requested within ${maxReturnDays} days of delivery`
            });
        }

        // Check if item already returned
        const existingSnapshot = await db.collection('return_requests')
            .where('orderId', '==', validatedData.orderId)
            .where('orderItemId', '==', validatedData.orderItemId)
            .get();

        // Convert existing docs to array to check status
        const existingReturns = existingSnapshot.docs.map(d => d.data());
        if (existingReturns.some((r: any) => r.status !== 'rejected')) {
            return res.status(400).json({ error: 'Return request already exists for this item' });
        }

        // Create return request
        const returnData = {
            ...validatedData,
            userId,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('return_requests').add(returnData);
        res.status(201).json({ returnRequest: { id: docRef.id, ...returnData } });

    } catch (error) {
        logger.error('Error creating return request:', error);
        res.status(500).json({ error: 'Failed to create return request' });
    }
}

// Get user's return requests
export async function getUserReturnRequests(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const snapshot = await db.collection('return_requests')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const returnRequests = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            // Fetch order details for display
            const orderDoc = await db.collection('orders').doc(String(data.orderId)).get();
            const order = orderDoc.exists ? orderDoc.data() : null;

            return {
                id: doc.id,
                ...data,
                order: order ? {
                    id: orderDoc.id,
                    customerName: (order as any).customerName,
                    total: (order as any).total,
                    createdAt: (order as any).createdAt,
                    items: (order as any).items
                } : null
            };
        }));

        res.json({
            returnRequests,
            pagination: { total: returnRequests.length, page: 1, limit: returnRequests.length, totalPages: 1 }
        });
    } catch (error) {
        logger.error('Error getting return requests:', error);
        res.status(500).json({ error: 'Failed to get return requests' });
    }
}

// Get return request details
export async function getReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { returnId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const doc = await db.collection('return_requests').doc(String(returnId)).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        const data = doc.data() as any;
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({ returnRequest: { id: doc.id, ...data } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get return request' });
    }
}

// Admin: Get all return requests
export async function getAllReturnRequests(req: AuthenticatedRequest, res: Response) {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        let query = db.collection('return_requests').orderBy('createdAt', 'desc');
        if (req.query.status) {
            query = query.where('status', '==', req.query.status);
        }

        const snapshot = await query.get();

        // Fetch User and Order details manually (No Join)
        const returnRequests = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();

            const [userDoc, orderDoc] = await Promise.all([
                db.collection('users').doc(String(data.userId)).get(),
                db.collection('orders').doc(String(data.orderId)).get()
            ]);

            return {
                id: doc.id,
                ...data,
                user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null,
                order: orderDoc.exists ? { id: orderDoc.id, ...orderDoc.data() } : null
            };
        }));

        res.json({
            returnRequests,
            pagination: { total: returnRequests.length, page: 1, limit: 50, totalPages: 1 }
        });

    } catch (error) {
        logger.error('Error getting all return requests:', error);
        res.status(500).json({ error: 'Failed to get return requests' });
    }
}

// Admin: Approve return request
export async function approveReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { returnId } = req.params;
        const { approved, rejectionReason } = req.body;

        const returnDoc = await db.collection('return_requests').doc(String(returnId)).get();
        if (!returnDoc.exists) {
            return res.status(404).json({ error: 'Return request not found' });
        }
        const returnData = returnDoc.data() as any;

        const updates = {
            status: approved ? 'approved' : 'rejected',
            approvedBy: req.user?.id,
            approvedAt: approved ? new Date().toISOString() : null,
            rejectionReason: approved ? null : rejectionReason
        };

        await db.collection('return_requests').doc(String(returnId)).update(updates);

        if (approved && returnData.refundType && returnData.refundAmount) {
            const orderDoc = await db.collection('orders').doc(String(returnData.orderId)).get();
            const order = orderDoc.data() as any;

            if (order && order.paymentId) {
                await db.collection('refund_transactions').add({
                    returnId,
                    paymentId: order.paymentId,
                    amount: returnData.refundAmount,
                    gateway: 'razorpay',
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });

                await db.collection('orders').doc(String(returnData.orderId)).update({ status: 'return-approved' });
            }
        }

        const updatedDoc = await db.collection('return_requests').doc(String(returnId)).get();
        res.json({ returnRequest: { id: updatedDoc.id, ...updatedDoc.data() } });

    } catch (error) {
        logger.error('Error approving return request:', error);
        res.status(500).json({ error: 'Failed to approve return request' });
    }
}

// Process refund
export async function processRefund(req: AuthenticatedRequest, res: Response) {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const validatedData = createRefundSchema.parse(req.body);
        const { returnId } = validatedData;

        // Process refund via Razorpay (assuming keys are set)
        const Razorpay = require('razorpay');
        if (!process.env.RAZORPAY_KEY_ID) {
            return res.status(500).json({ error: 'Razorpay keys missing' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const returnDoc = await db.collection('return_requests').doc(String(returnId)).get();
        if (!returnDoc.exists) return res.status(404).json({ error: 'Return not found' });
        const returnData = returnDoc.data() as any;

        const orderDoc = await db.collection('orders').doc(returnData.orderId).get();
        const order = orderDoc.data() as any;

        const refundData = {
            amount: validatedData.amount * 100, // paise
            receipt: order.transactionId || `REF-${returnId}`,
            notes: { returnId }
        };

        let refund;
        try {
            refund = await razorpay.refund(refundData);
        } catch (err: any) {
            refund = { error: true, error_description: err.message };
        }

        // Update Transaction
        const refundTxQuery = await db.collection('refund_transactions').where('returnId', '==', returnId).get();
        if (!refundTxQuery.empty) {
            const txDoc = refundTxQuery.docs[0];
            await db.collection('refund_transactions').doc(txDoc.id).update({
                status: refund.error ? 'failed' : 'completed',
                gatewayId: refund.id || null,
                processedAt: new Date().toISOString(),
                failureReason: refund.error ? refund.error_description : null
            });
        }

        // Update Return Request
        await db.collection('return_requests').doc(returnId).update({
            status: refund.error ? 'refund-failed' : 'completed',
            completedAt: refund.error ? null : new Date().toISOString()
        });

        // Update Order
        if (!refund.error) {
            await db.collection('orders').doc(returnData.orderId).update({ status: 'return-completed' });
        }

        res.json({
            success: !refund.error,
            refund: refund.error ? null : refund,
            message: refund.error ? 'Refund failed: ' + refund.error_description : 'Refund processed successfully'
        });

    } catch (error) {
        logger.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
}

// Get return policy information (Static content, safe to keep as is but good to have)
export async function getReturnPolicy(req: Request, res: Response) {
    try {
        const regularUserPolicy = {
            returnWindowDays: 15,
            returnConditions: ['new', 'unused', 'original-packaging'],
            restockingFee: 50,
            nonReturnableItems: ['personal-care-items', 'custom-products', 'clearance-items'],
            shippingCost: 'customer-pays'
        };

        const dentalProfessionalPolicy = {
            returnWindowDays: 30,
            returnConditions: ['new', 'unused', 'original-packaging', 'damaged-in-transit'],
            restockingFee: 0,
            nonReturnableItems: ['personal-care-items', 'consumables', 'expired-products'],
            shippingCost: 'seller-pays'
        };

        res.json({
            regularUserPolicy,
            dentalProfessionalPolicy,
            generalTerms: 'All returns subject to inspection and approval by Alpha Dentkart team',
            contactSupport: 'For return issues, contact support@alphadentkart.com'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get return policy' });
    }
}