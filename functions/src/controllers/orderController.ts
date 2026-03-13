import { Request, Response } from 'express';
import { db, admin, withTimeout } from '../config/firebase';
import { createOrderSchema } from '../utils/validation';
import logger from '../utils/logger';

export async function createOrder(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        const validatedData = createOrderSchema.parse(req.body);

        // --- Payment Verification Logic ---
        if (validatedData.paymentMethod === 'razorpay') {
            const { paymentId, razorpay_order_id, signature } = req.body;

            if (!paymentId || !razorpay_order_id || !signature) {
                return res.status(400).json({ error: 'Missing payment details for verification' });
            }

            const { verifyRazorpaySignature } = await import('../utils/payment');
            const isValid = verifyRazorpaySignature(razorpay_order_id, paymentId, signature);

            if (!isValid) {
                logger.warn('Invalid Razorpay signature', { userId, razorpay_order_id });
                return res.status(400).json({ error: 'Payment verification failed' });
            }
        }

        // Handle WhatsApp Opt-In
        if (userId && validatedData.whatsappOptIn) {
            try {
                await db.collection('users').doc(userId).set({ whatsappOptIn: true }, { merge: true });
            } catch (e) {
                logger.error('Failed to update WhatsApp Opt-In', { error: e, userId });
            }
        }

        const orderData = {
            userId: userId || null,
            customerName: validatedData.shippingAddress?.name || 'Guest',
            customerEmail: validatedData.shippingAddress?.email || validatedData.customerEmail || null,
            total: validatedData.total,
            items: validatedData.items,
            shippingAddress: validatedData.shippingAddress || null,
            paymentMethod: validatedData.paymentMethod || 'cod',
            paymentId: req.body.paymentId || null,
            razorpay_order_id: req.body.razorpay_order_id || null,
            paymentStatus: validatedData.paymentMethod === 'razorpay' ? 'paid' : 'pending',
            status: 'Processing',
            couponId: validatedData.couponId || null,
            couponDiscount: validatedData.couponDiscount || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const orderRef = await withTimeout(db.collection('orders').add(orderData));
        const orderResponse = { id: orderRef.id, ...orderData, createdAt: new Date().toISOString() };

        // Record coupon usage
        if (validatedData.couponId) {
            try {
                const couponRef = db.collection('coupons').doc(validatedData.couponId);
                const couponDoc = await withTimeout(couponRef.get());
                if (couponDoc.exists) {
                    await withTimeout(db.collection('used_coupons').add({
                        couponId: validatedData.couponId,
                        userId: userId || 'guest',
                        orderId: orderRef.id,
                        discountAmount: validatedData.couponDiscount || 0,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    }));
                    await withTimeout(couponRef.update({ usageCount: admin.firestore.FieldValue.increment(1) }));
                }
            } catch (e) {
                logger.error('Failed to record coupon usage', { error: e, couponId: validatedData.couponId });
            }
        }

        // Push notification (non-blocking)
        try {
            const { NotificationService } = await import('../services/NotificationService');
            await NotificationService.sendToUser(
                userId,
                'Order Placed Successfully! 🦷📦',
                `Your order #${orderRef.id.slice(0, 8)} is being processed.`,
                { orderId: orderRef.id }
            );
        } catch (pushErr) {
            logger.error('Failed to send order push notification', { error: pushErr, orderId: orderRef.id });
        }

        res.status(201).json({ order: orderResponse });
    } catch (error: any) {
        logger.error('CreateOrder error', { error });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

// Create a Razorpay order server-side. Must be called before the frontend opens the payment modal.
// The returned razorpay_order_id is passed to the Razorpay SDK, making signature verification secure.
export async function createRazorpayOrder(req: Request, res: Response) {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            logger.error('Razorpay credentials not configured');
            return res.status(500).json({ error: 'Payment gateway not configured' });
        }

        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // Razorpay expects paise
                currency,
                receipt: receipt || `rcpt_${Date.now()}`,
            }),
        });

        if (!razorpayRes.ok) {
            const errData = await razorpayRes.json();
            logger.error('Razorpay order creation failed', { error: errData });
            return res.status(502).json({ error: 'Failed to create payment order' });
        }

        const razorpayOrder = await razorpayRes.json() as any;
        logger.info('Razorpay order created', { orderId: razorpayOrder.id, amount });

        res.json({
            razorpay_order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: keyId,
        });
    } catch (error) {
        logger.error('CreateRazorpayOrder error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : data.createdAt,
            };
        });

        res.json({ orders });
    } catch (error) {
        logger.error('GetMyOrders error', { error, userId: (req as any).user?.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAllOrders(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 8;
        const search = req.query.search as string;
        const status = req.query.status as string;
        const year = req.query.year as string;
        const month = req.query.month as string;

        let query: FirebaseFirestore.Query = db.collection('orders');

        if (status && status !== 'All') {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        let allOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : data.createdAt,
            };
        });

        if (search) {
            const s = search.toLowerCase();
            allOrders = allOrders.filter((o: any) =>
                o.id.toLowerCase().includes(s) ||
                (o.customerName && o.customerName.toLowerCase().includes(s))
            );
        }

        if (year && month) {
            const y = parseInt(year);
            const m = parseInt(month);
            allOrders = allOrders.filter(o => {
                if (!o.createdAt) return false;
                const d = new Date(o.createdAt);
                return d.getFullYear() === y && (d.getMonth() + 1) === m;
            });
        }

        const total = allOrders.length;
        const paginatedOrders = allOrders.slice((page - 1) * limit, (page - 1) * limit + limit);

        res.json({ orders: paginatedOrders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        logger.error('GetAllOrders admin error', { error });
        res.status(500).json({ error: 'Internal server error while fetching orders' });
    }
}

export async function updateOrderStatus(req: Request, res: Response) {
    try {
        const orderId = String(req.params.id);
        const { status, trackingProvider, trackingNumber, trackingUrl } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ error: 'Order ID and status are required' });
        }

        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }

        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updateData: any = { status, updatedAt: new Date().toISOString() };

        if (trackingProvider && trackingNumber) {
            updateData.trackingProvider = trackingProvider;
            updateData.trackingNumber = trackingNumber;
            updateData.trackingUrl = trackingUrl || '';
            if (status === 'Shipped' && !orderDoc.data()?.shippedDate) {
                updateData.shippedDate = new Date().toISOString();
            }
        }

        await orderRef.update(updateData);
        const updatedDoc = await orderRef.get();
        const updatedOrder = { id: updatedDoc.id, ...updatedDoc.data() };

        logger.info('Order status updated by admin', { orderId, status });
        res.json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error: any) {
        logger.error('Error updating order status in try-catch', { 
            error: error.message || error, 
            stack: error.stack,
            orderId: req.params.id,
            bodySent: req.body
        });
        res.status(500).json({ error: 'Failed to update order status: ' + (error.message || 'Unknown DB error') });
    }
}

export async function deleteOrder(req: Request, res: Response) {
    try {
        const orderId = String(req.params.id);

        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await orderRef.delete();
        logger.info('Order deleted by admin', { orderId });
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        logger.error('Error deleting order', { error, orderId: req.params.id });
        res.status(500).json({ error: 'Failed to delete order' });
    }
}
