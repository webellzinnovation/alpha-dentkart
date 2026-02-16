import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, admin } from '../config/firebase'; // Firestore
import { z } from 'zod';
import logger from '../utils/logger';

// Types for request modules
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}

// Validation schemas
const guestSessionSchema = z.object({
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal(''))
});

const guestOrderSchema = z.object({
    guestSessionId: z.string(),
    items: z.array(z.object({
        productId: z.string().or(z.number().transform(String)), // Handle both ID types
        quantity: z.number(),
        price: z.number().optional()
    })),
    shippingAddress: z.object({
        name: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        phone: z.string(),
        email: z.string().email()
    }),
    paymentMethod: z.string(),
    total: z.number()
});

// Create guest session
export const createGuestSession = async (req: Request, res: Response) => {
    try {
        const { email, phone } = guestSessionSchema.parse(req.body);
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        // Store in Database
        await db.collection('guest_sessions').doc(sessionId).set({
            sessionId,
            email: email || null,
            phone: phone || null,
            expiresAt,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                expiresAt
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, error: error.issues });
        } else {
            logger.error('Create guest session error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

// Validate guest session
export const validateGuestSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const sessionDoc = await db.collection('guest_sessions').doc(String(sessionId)).get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const session = sessionDoc.data() as any;

        if (new Date(session.expiresAt) < new Date()) {
            return res.status(400).json({ success: false, message: 'Session has expired' });
        }

        // Count orders for this session
        const ordersSnapshot = await db.collection('orders').where('guestSessionId', '==', sessionId).count().get();
        const orderCount = ordersSnapshot.data().count;

        res.json({
            success: true,
            message: 'Session is valid',
            data: {
                sessionId: session.sessionId,
                email: session.email,
                phone: session.phone,
                orderCount
            }
        });
    } catch (error) {
        logger.error('Validate guest session error:', error);
        res.status(500).json({ success: false, message: 'Failed to validate session' });
    }
};

// Create guest order
export const createGuestOrder = async (req: Request, res: Response) => {
    try {
        const inputData = {
            guestSessionId: req.body.sessionId || req.body.guestSessionId,
            items: req.body.items,
            shippingAddress: req.body.shippingAddress || (req.body.customerInfo?.address ? { ...req.body.customerInfo.address, email: req.body.customerInfo.email, phone: req.body.customerInfo.phone, name: req.body.customerInfo.name } : undefined),
            paymentMethod: req.body.paymentMethod,
            total: req.body.total
        };

        if (!inputData.shippingAddress && req.body.customerInfo) {
            inputData.shippingAddress = {
                name: req.body.customerInfo.name,
                email: req.body.customerInfo.email,
                phone: req.body.customerInfo.phone,
                ...req.body.customerInfo.address
            };
        }

        const { guestSessionId, items, shippingAddress, paymentMethod, total } = guestOrderSchema.parse(inputData);

        // Validate Session
        const sessionDoc = await db.collection('guest_sessions').doc(guestSessionId).get();
        if (!sessionDoc.exists || new Date(sessionDoc.data()?.expiresAt) < new Date()) {
            return res.status(401).json({ success: false, error: 'Guest session expired or invalid' });
        }
        const session = sessionDoc.data() as any;

        // Create Order in Database
        const orderData = {
            isGuestOrder: true,
            guestSessionId,
            guestEmail: shippingAddress.email,
            guestPhone: shippingAddress.phone,
            customerName: shippingAddress.name,
            total,
            status: 'Processing',
            paymentMethod,
            paymentStatus: 'pending',
            items: items, // Native array
            shippingAddress: shippingAddress, // Native object
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const orderRef = await db.collection('orders').add(orderData);

        // Update Session with contact info if provided
        if ((shippingAddress.email || shippingAddress.phone) && (!session.email || !session.phone)) {
            await db.collection('guest_sessions').doc(guestSessionId).update({
                email: shippingAddress.email || session.email,
                phone: shippingAddress.phone || session.phone,
                updatedAt: new Date().toISOString()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Guest order created successfully',
            data: {
                orderId: orderRef.id,
                customerName: orderData.customerName,
                status: orderData.status,
                total: orderData.total,
                paymentMethod: orderData.paymentMethod,
                paymentStatus: orderData.paymentStatus
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, error: error.issues });
        } else {
            logger.error('Create guest order error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

// Get guest order
export const getGuestOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { email } = req.query as { email?: string };

        const orderDoc = await db.collection('orders').doc(String(orderId)).get();

        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        const order = { id: orderDoc.id, ...orderDoc.data() } as any;

        if (email && order.guestEmail !== email) {
            return res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        logger.error('Get guest order error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Update guest order status
export const updateGuestOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const allowedFields = ['status', 'paymentStatus', 'paymentId', 'transactionId'];
        const dataToUpdate: any = { updatedAt: new Date().toISOString() };

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) dataToUpdate[field] = updateData[field];
        });

        await db.collection('orders').doc(String(orderId)).update(dataToUpdate);
        const updatedDoc = await db.collection('orders').doc(String(orderId)).get();

        res.json({ success: true, message: 'Guest order updated successfully', data: { id: updatedDoc.id, ...updatedDoc.data() } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
};

// Get guest order status
export const getGuestOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const orderDoc = await db.collection('orders').doc(String(orderId)).get();

        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderDoc.data() as any;

        // Fetch tracking info
        const trackingSnapshot = await db.collection('shipping_tracking').where('orderId', '==', orderId).get();
        const tracking = trackingSnapshot.docs.map(t => t.data());

        res.json({
            success: true,
            message: 'Guest order status retrieved successfully',
            data: {
                id: orderDoc.id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                shippingTracking: tracking,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve order status' });
    }
};

// Convert guest order
export const convertGuestOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId || !req.user?.id) {
            return res.status(400).json({ success: false, message: 'Order ID and User authentication required' });
        }

        await db.collection('orders').doc(String(orderId)).update({
            userId: req.user.id,
            isGuestOrder: false,
            guestSessionId: null,
            updatedAt: new Date().toISOString()
        });

        const updatedDoc = await db.collection('orders').doc(String(orderId)).get();

        res.json({
            success: true,
            message: 'Guest order converted to user order successfully',
            data: { id: updatedDoc.id, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to convert guest order' });
    }
};

// Get guest orders
export const getGuestOrders = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        // Validate session first
        const sessionDoc = await db.collection('guest_sessions').doc(String(sessionId)).get();
        if (!sessionDoc.exists) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const ordersSnapshot = await db.collection('orders').where('guestSessionId', '==', sessionId).get();
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            success: true,
            message: 'Guest orders retrieved successfully',
            data: {
                sessionId: sessionId,
                orders: orders,
                orderCount: orders.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve guest orders' });
    }
};