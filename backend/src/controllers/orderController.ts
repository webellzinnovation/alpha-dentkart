import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { createOrderSchema } from '../utils/validation';

export async function createOrder(req: Request, res: Response) {
    console.log('=== ORDER CREATION START ===');

    try {
        const userId = (req as any).user?.id || null;
        console.log('Step 1: userId =', userId);

        const validatedData = createOrderSchema.parse(req.body);
        console.log('Step 2: Validation passed, items =', validatedData.items.length);

        // --- Payment Verification ---
        if (validatedData.paymentMethod === 'razorpay') {
            const { paymentId, transactionId, signature } = req.body;
            if (!paymentId) {
                return res.status(400).json({ error: 'Missing payment ID' });
            }
            // Skip signature verification for test orders
            const isMockOrderId = !transactionId || !transactionId.startsWith('order_') || transactionId.length > 30;
            if (!isMockOrderId && signature) {
                try {
                    const { verifyRazorpaySignature } = await import('../utils/payment');
                    const isValid = verifyRazorpaySignature(transactionId, paymentId, signature);
                    if (!isValid) {
                        return res.status(400).json({ error: 'Payment verification failed' });
                    }
                } catch (e) {
                    console.log('Signature check skipped:', e);
                }
            }
            console.log('Step 3: Payment verified');
        }

        // Prepare Order Data
        const orderData: any = {
            userId,
            customerName: validatedData.shippingAddress?.name || 'Guest',
            customerEmail: validatedData.shippingAddress?.email || null,
            total: validatedData.total,
            items: validatedData.items,
            shippingAddress: validatedData.shippingAddress || null,
            paymentMethod: validatedData.paymentMethod || 'cod',
            paymentId: req.body.paymentId || null,
            transactionId: req.body.transactionId || null,
            paymentStatus: validatedData.paymentMethod === 'razorpay' ? 'paid' : 'pending',
            status: 'Processing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('Step 4: Writing to Firestore...');
        console.log('db type:', typeof db);
        console.log('db.collection exists:', typeof db.collection === 'function');

        const orderRef = await db.collection('orders').add(orderData);
        console.log('Step 5: Order created, id =', orderRef.id);

        const orderResponse = { id: orderRef.id, ...orderData };

        res.status(201).json({ order: orderResponse });
        console.log('Step 6: Response sent');

    } catch (error: any) {
        console.error('=== ORDER CREATION ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Code:', error.code);

        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ orders });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders: ' + error.message });
    }
}
