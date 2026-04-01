"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuestOrders = exports.convertGuestOrder = exports.getGuestOrderStatus = exports.updateGuestOrder = exports.getGuestOrder = exports.createGuestOrder = exports.validateGuestSession = exports.createGuestSession = void 0;
const uuid_1 = require("uuid");
const firebase_1 = require("../config/firebase"); // Firestore
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Validation schemas
const guestSessionSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional().or(zod_1.z.literal(''))
});
const guestOrderSchema = zod_1.z.object({
    guestSessionId: zod_1.z.string(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().or(zod_1.z.number().transform(String)), // Handle both ID types
        quantity: zod_1.z.number(),
        price: zod_1.z.number().optional()
    })),
    shippingAddress: zod_1.z.object({
        name: zod_1.z.string(),
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        zip: zod_1.z.string(),
        phone: zod_1.z.string(),
        email: zod_1.z.string().email()
    }),
    paymentMethod: zod_1.z.string(),
    total: zod_1.z.number()
});
// Create guest session
const createGuestSession = async (req, res) => {
    try {
        const { email, phone } = guestSessionSchema.parse(req.body);
        const sessionId = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        // Store in Database
        await firebase_1.db.collection('guest_sessions').doc(sessionId).set({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.issues });
        }
        else {
            logger_1.default.error('Create guest session error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};
exports.createGuestSession = createGuestSession;
// Validate guest session
const validateGuestSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }
        const sessionDoc = await firebase_1.db.collection('guest_sessions').doc(String(sessionId)).get();
        if (!sessionDoc.exists) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        const session = sessionDoc.data();
        if (new Date(session.expiresAt) < new Date()) {
            return res.status(400).json({ success: false, message: 'Session has expired' });
        }
        // Count orders for this session
        const ordersSnapshot = await firebase_1.db.collection('orders').where('guestSessionId', '==', sessionId).count().get();
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
    }
    catch (error) {
        logger_1.default.error('Validate guest session error:', error);
        res.status(500).json({ success: false, message: 'Failed to validate session' });
    }
};
exports.validateGuestSession = validateGuestSession;
// Create guest order
const createGuestOrder = async (req, res) => {
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
        const sessionDoc = await firebase_1.db.collection('guest_sessions').doc(guestSessionId).get();
        if (!sessionDoc.exists || new Date(sessionDoc.data()?.expiresAt) < new Date()) {
            return res.status(401).json({ success: false, error: 'Guest session expired or invalid' });
        }
        const session = sessionDoc.data();
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
        const orderRef = await firebase_1.db.collection('orders').add(orderData);
        // Update Session with contact info if provided
        if ((shippingAddress.email || shippingAddress.phone) && (!session.email || !session.phone)) {
            await firebase_1.db.collection('guest_sessions').doc(guestSessionId).update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.issues });
        }
        else {
            logger_1.default.error('Create guest order error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};
exports.createGuestOrder = createGuestOrder;
// Get guest order
const getGuestOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { email } = req.query;
        const orderDoc = await firebase_1.db.collection('orders').doc(String(orderId)).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        const order = { id: orderDoc.id, ...orderDoc.data() };
        if (email && order.guestEmail !== email) {
            return res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        logger_1.default.error('Get guest order error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
exports.getGuestOrder = getGuestOrder;
// Update guest order status
const updateGuestOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const allowedFields = ['status', 'paymentStatus', 'paymentId', 'transactionId'];
        const dataToUpdate = { updatedAt: new Date().toISOString() };
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined)
                dataToUpdate[field] = updateData[field];
        });
        await firebase_1.db.collection('orders').doc(String(orderId)).update(dataToUpdate);
        const updatedDoc = await firebase_1.db.collection('orders').doc(String(orderId)).get();
        res.json({ success: true, message: 'Guest order updated successfully', data: { id: updatedDoc.id, ...updatedDoc.data() } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
};
exports.updateGuestOrder = updateGuestOrder;
// Get guest order status
const getGuestOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDoc = await firebase_1.db.collection('orders').doc(String(orderId)).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderDoc.data();
        // Fetch tracking info
        const trackingSnapshot = await firebase_1.db.collection('shipping_tracking').where('orderId', '==', orderId).get();
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve order status' });
    }
};
exports.getGuestOrderStatus = getGuestOrderStatus;
// Convert guest order
const convertGuestOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId || !req.user?.id) {
            return res.status(400).json({ success: false, message: 'Order ID and User authentication required' });
        }
        await firebase_1.db.collection('orders').doc(String(orderId)).update({
            userId: req.user.id,
            isGuestOrder: false,
            guestSessionId: null,
            updatedAt: new Date().toISOString()
        });
        const updatedDoc = await firebase_1.db.collection('orders').doc(String(orderId)).get();
        res.json({
            success: true,
            message: 'Guest order converted to user order successfully',
            data: { id: updatedDoc.id, ...updatedDoc.data() }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to convert guest order' });
    }
};
exports.convertGuestOrder = convertGuestOrder;
// Get guest orders
const getGuestOrders = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Validate session first
        const sessionDoc = await firebase_1.db.collection('guest_sessions').doc(String(sessionId)).get();
        if (!sessionDoc.exists) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        const ordersSnapshot = await firebase_1.db.collection('orders').where('guestSessionId', '==', sessionId).get();
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve guest orders' });
    }
};
exports.getGuestOrders = getGuestOrders;
//# sourceMappingURL=guestCheckoutController.js.map