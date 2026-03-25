import { Request, Response } from 'express';
import { db, admin } from '../config/firebase'; // Firestore & Admin for FieldValue
import { createOrderSchema } from '../utils/validation';
import logger from '../utils/logger';

export async function createOrder(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const validatedData = createOrderSchema.parse(req.body);

        // --- Payment Verification Logic ---
        if (validatedData.paymentMethod === 'razorpay') {
            const { paymentId, transactionId, signature } = req.body;

            if (!paymentId || !transactionId || !signature) {
                return res.status(400).json({ error: 'Missing payment details for verification' });
            }

            // Lazy import to avoid circular dependencies
            const { verifyRazorpaySignature } = await import('../utils/payment');
            const isValid = verifyRazorpaySignature(transactionId, paymentId, signature);

            if (!isValid) {
                logger.warn('Invalid Razorpay signature', { userId, transactionId });
                return res.status(400).json({ error: 'Payment verification failed' });
            }
        }
        // ----------------------------------

        // Handle WhatsApp Opt-In
        if (userId && validatedData.whatsappOptIn) {
            try {
                const userRef = db.collection('users').doc(userId);
                // We use set with merge to ensure we don't overwrite if not exists (though verify user exists logic usually handles this)
                await userRef.set({ whatsappOptIn: true }, { merge: true });
            } catch (e) {
                logger.error('Failed to update WhatsApp Opt-In', { error: e, userId });
            }
        }

        // Prepare Order Data
        const orderData = {
            userId,
            customerName: validatedData.shippingAddress?.name || 'Guest',
            customerEmail: validatedData.shippingAddress?.email || null,
            total: validatedData.total,
            items: validatedData.items, // Store natively
            shippingAddress: validatedData.shippingAddress || null, // Store natively
            paymentMethod: validatedData.paymentMethod || 'cod',
            paymentId: req.body.paymentId || null,
            transactionId: req.body.transactionId || null,
            paymentStatus: validatedData.paymentMethod === 'razorpay' ? 'paid' : 'pending',
            status: 'Processing',
            couponId: validatedData.couponId || null,
            couponDiscount: validatedData.couponDiscount || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await db.collection('orders').add(orderData);
        // Add ID to the object for response (or use what we have, but createdAt will be a server timestamp object)
        const orderResponse = { id: orderRef.id, ...orderData, createdAt: new Date().toISOString() };

        // Record used coupon if applicable
        if (validatedData.couponId) {
            try {
                const couponRef = db.collection('coupons').doc(validatedData.couponId);
                const couponDoc = await couponRef.get();

                if (couponDoc.exists) {
                    // Record usage
                    await db.collection('used_coupons').add({
                        couponId: validatedData.couponId,
                        userId: userId || 'guest',
                        orderId: orderRef.id,
                        discountAmount: validatedData.couponDiscount || 0,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Increment usage count atomically
                    await couponRef.update({
                        usageCount: admin.firestore.FieldValue.increment(1)
                    });
                }
            } catch (e) {
                logger.error('Failed to record coupon usage', { error: e, couponId: validatedData.couponId });
            }
        }

        // Trigger Push Notification
        try {
            const { NotificationService } = await import('../services/NotificationService');
            // We need to ensure NotificationService is compatible with Firestore if it queries anything.
            // Assuming it just sends to FCM using token stored in User (which we might need to fetch).
            // NOTE: Check NotificationService later.
            await NotificationService.sendToUser(
                userId,
                "Order Placed Successfully! 🦷📦",
                `Your order #${orderRef.id.slice(0, 8)} is being processed.`,
                { orderId: orderRef.id }
            );
        } catch (pushErr) {
            logger.error('Failed to send order push notification', { error: pushErr, orderId: orderRef.id });
        }

        res.status(201).json({ order: orderResponse });
    } catch (error) {
        logger.error('CreateOrder error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            // Handle Timestamp to Date conversion if needed, but JSON.stringify handles it as ISO string usually
            return {
                id: doc.id,
                ...data,
                // Ensure items/address are objects (Firestore does this automatically)
                createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : data.createdAt
            };
        });

        res.json({ orders });
    } catch (error) {
        logger.error('GetMyOrders error', { error, userId: (req as any).user?.userId });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAllOrders(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const status = req.query.status as string;
        
        const baseRef = db.collection('orders');
        
        let query: FirebaseFirestore.Query;
        if (status) {
            query = baseRef.where('status', '==', status);
        } else {
            query = baseRef;
        }
        
        const countSnapshot = await query.get();
        const total = countSnapshot.size;
        
        const offset = (page - 1) * limit;
        const snapshot = await query
            .orderBy('createdAt', 'desc')
            .offset(offset)
            .limit(limit)
            .get();

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : data.createdAt
            };
        });

        res.json({ 
            orders, 
            pagination: { 
                total, 
                page, 
                limit, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        logger.error('GetAllOrders error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateOrderTracking(req: Request, res: Response) {
    try {
        const { orderId, courierName, trackingNumber, estimatedDelivery, status } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updateData: any = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (status) {
            updateData.status = status;
        }
        if (courierName) {
            updateData.courierName = courierName;
        }
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }
        if (estimatedDelivery) {
            updateData.estimatedDelivery = estimatedDelivery;
        }

        await orderRef.update(updateData);

        logger.info('Order tracking updated', { orderId, courierName, trackingNumber });

        res.json({
            success: true,
            message: 'Order tracking updated successfully',
            data: {
                orderId,
                courierName,
                trackingNumber,
                estimatedDelivery,
                status
            }
        });
    } catch (error) {
        logger.error('UpdateOrderTracking error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
