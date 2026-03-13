"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.createRazorpayOrder = createRazorpayOrder;
exports.getMyOrders = getMyOrders;
exports.getAllOrders = getAllOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.deleteOrder = deleteOrder;
const firebase_1 = require("../config/firebase");
const validation_1 = require("../utils/validation");
const logger_1 = __importDefault(require("../utils/logger"));
async function createOrder(req, res) {
    try {
        const userId = req.user?.id;
        const validatedData = validation_1.createOrderSchema.parse(req.body);
        // --- Payment Verification Logic ---
        if (validatedData.paymentMethod === 'razorpay') {
            const { paymentId, razorpay_order_id, signature } = req.body;
            if (!paymentId || !razorpay_order_id || !signature) {
                return res.status(400).json({ error: 'Missing payment details for verification' });
            }
            const { verifyRazorpaySignature } = await Promise.resolve().then(() => __importStar(require('../utils/payment')));
            const isValid = verifyRazorpaySignature(razorpay_order_id, paymentId, signature);
            if (!isValid) {
                logger_1.default.warn('Invalid Razorpay signature', { userId, razorpay_order_id });
                return res.status(400).json({ error: 'Payment verification failed' });
            }
        }
        // Handle WhatsApp Opt-In
        if (userId && validatedData.whatsappOptIn) {
            try {
                await firebase_1.db.collection('users').doc(userId).set({ whatsappOptIn: true }, { merge: true });
            }
            catch (e) {
                logger_1.default.error('Failed to update WhatsApp Opt-In', { error: e, userId });
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
            createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        };
        const orderRef = await (0, firebase_1.withTimeout)(firebase_1.db.collection('orders').add(orderData));
        const orderResponse = { id: orderRef.id, ...orderData, createdAt: new Date().toISOString() };
        // Record coupon usage
        if (validatedData.couponId) {
            try {
                const couponRef = firebase_1.db.collection('coupons').doc(validatedData.couponId);
                const couponDoc = await (0, firebase_1.withTimeout)(couponRef.get());
                if (couponDoc.exists) {
                    await (0, firebase_1.withTimeout)(firebase_1.db.collection('used_coupons').add({
                        couponId: validatedData.couponId,
                        userId: userId || 'guest',
                        orderId: orderRef.id,
                        discountAmount: validatedData.couponDiscount || 0,
                        createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
                    }));
                    await (0, firebase_1.withTimeout)(couponRef.update({ usageCount: firebase_1.admin.firestore.FieldValue.increment(1) }));
                }
            }
            catch (e) {
                logger_1.default.error('Failed to record coupon usage', { error: e, couponId: validatedData.couponId });
            }
        }
        // Push notification (non-blocking)
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/NotificationService')));
            await NotificationService.sendToUser(userId, 'Order Placed Successfully! 🦷📦', `Your order #${orderRef.id.slice(0, 8)} is being processed.`, { orderId: orderRef.id });
        }
        catch (pushErr) {
            logger_1.default.error('Failed to send order push notification', { error: pushErr, orderId: orderRef.id });
        }
        res.status(201).json({ order: orderResponse });
    }
    catch (error) {
        logger_1.default.error('CreateOrder error', { error });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}
// Create a Razorpay order server-side. Must be called before the frontend opens the payment modal.
// The returned razorpay_order_id is passed to the Razorpay SDK, making signature verification secure.
async function createRazorpayOrder(req, res) {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            logger_1.default.error('Razorpay credentials not configured');
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
            logger_1.default.error('Razorpay order creation failed', { error: errData });
            return res.status(502).json({ error: 'Failed to create payment order' });
        }
        const razorpayOrder = await razorpayRes.json();
        logger_1.default.info('Razorpay order created', { orderId: razorpayOrder.id, amount });
        res.json({
            razorpay_order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: keyId,
        });
    }
    catch (error) {
        logger_1.default.error('CreateRazorpayOrder error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMyOrders(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const snapshot = await firebase_1.db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            };
        });
        res.json({ orders });
    }
    catch (error) {
        logger_1.default.error('GetMyOrders error', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getAllOrders(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const search = req.query.search;
        const status = req.query.status;
        const year = req.query.year;
        const month = req.query.month;
        let query = firebase_1.db.collection('orders');
        if (status && status !== 'All') {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        let allOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            };
        });
        if (search) {
            const s = search.toLowerCase();
            allOrders = allOrders.filter((o) => o.id.toLowerCase().includes(s) ||
                (o.customerName && o.customerName.toLowerCase().includes(s)));
        }
        if (year && month) {
            const y = parseInt(year);
            const m = parseInt(month);
            allOrders = allOrders.filter(o => {
                if (!o.createdAt)
                    return false;
                const d = new Date(o.createdAt);
                return d.getFullYear() === y && (d.getMonth() + 1) === m;
            });
        }
        const total = allOrders.length;
        const paginatedOrders = allOrders.slice((page - 1) * limit, (page - 1) * limit + limit);
        res.json({ orders: paginatedOrders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    catch (error) {
        logger_1.default.error('GetAllOrders admin error', { error });
        res.status(500).json({ error: 'Internal server error while fetching orders' });
    }
}
async function updateOrderStatus(req, res) {
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
        const orderRef = firebase_1.db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const updateData = { status, updatedAt: new Date().toISOString() };
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
        logger_1.default.info('Order status updated by admin', { orderId, status });
        res.json({ message: 'Order status updated successfully', order: updatedOrder });
    }
    catch (error) {
        logger_1.default.error('Error updating order status in try-catch', {
            error: error.message || error,
            stack: error.stack,
            orderId: req.params.id,
            bodySent: req.body
        });
        res.status(500).json({ error: 'Failed to update order status: ' + (error.message || 'Unknown DB error') });
    }
}
async function deleteOrder(req, res) {
    try {
        const orderId = String(req.params.id);
        const orderRef = firebase_1.db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        await orderRef.delete();
        logger_1.default.info('Order deleted by admin', { orderId });
        res.json({ message: 'Order deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting order', { error, orderId: req.params.id });
        res.status(500).json({ error: 'Failed to delete order' });
    }
}
//# sourceMappingURL=orderController.js.map