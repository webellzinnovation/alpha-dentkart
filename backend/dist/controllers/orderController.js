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
exports.getMyOrders = getMyOrders;
exports.getAllOrders = getAllOrders;
exports.updateOrderTracking = updateOrderTracking;
const firebase_1 = require("../config/firebase"); // Firestore & Admin for FieldValue
const validation_1 = require("../utils/validation");
const logger_1 = __importDefault(require("../utils/logger"));
async function createOrder(req, res) {
    try {
        const userId = req.user?.userId;
        const validatedData = validation_1.createOrderSchema.parse(req.body);
        // --- Payment Verification Logic ---
        if (validatedData.paymentMethod === 'razorpay') {
            const { paymentId, transactionId, signature } = req.body;
            if (!paymentId || !transactionId || !signature) {
                return res.status(400).json({ error: 'Missing payment details for verification' });
            }
            // Lazy import to avoid circular dependencies
            const { verifyRazorpaySignature } = await Promise.resolve().then(() => __importStar(require('../utils/payment')));
            const isValid = verifyRazorpaySignature(transactionId, paymentId, signature);
            if (!isValid) {
                logger_1.default.warn('Invalid Razorpay signature', { userId, transactionId });
                return res.status(400).json({ error: 'Payment verification failed' });
            }
        }
        // ----------------------------------
        // Handle WhatsApp Opt-In
        if (userId && validatedData.whatsappOptIn) {
            try {
                const userRef = firebase_1.db.collection('users').doc(userId);
                // We use set with merge to ensure we don't overwrite if not exists (though verify user exists logic usually handles this)
                await userRef.set({ whatsappOptIn: true }, { merge: true });
            }
            catch (e) {
                logger_1.default.error('Failed to update WhatsApp Opt-In', { error: e, userId });
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
            createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
        };
        const orderRef = await firebase_1.db.collection('orders').add(orderData);
        // Add ID to the object for response (or use what we have, but createdAt will be a server timestamp object)
        const orderResponse = { id: orderRef.id, ...orderData, createdAt: new Date().toISOString() };
        // Record used coupon if applicable
        if (validatedData.couponId) {
            try {
                const couponRef = firebase_1.db.collection('coupons').doc(validatedData.couponId);
                const couponDoc = await couponRef.get();
                if (couponDoc.exists) {
                    // Record usage
                    await firebase_1.db.collection('used_coupons').add({
                        couponId: validatedData.couponId,
                        userId: userId || 'guest',
                        orderId: orderRef.id,
                        discountAmount: validatedData.couponDiscount || 0,
                        createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Increment usage count atomically
                    await couponRef.update({
                        usageCount: firebase_1.admin.firestore.FieldValue.increment(1)
                    });
                }
            }
            catch (e) {
                logger_1.default.error('Failed to record coupon usage', { error: e, couponId: validatedData.couponId });
            }
        }
        // Trigger Push Notification
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/NotificationService')));
            // We need to ensure NotificationService is compatible with Firestore if it queries anything.
            // Assuming it just sends to FCM using token stored in User (which we might need to fetch).
            // NOTE: Check NotificationService later.
            await NotificationService.sendToUser(userId, "Order Placed Successfully! 🦷📦", `Your order #${orderRef.id.slice(0, 8)} is being processed.`, { orderId: orderRef.id });
        }
        catch (pushErr) {
            logger_1.default.error('Failed to send order push notification', { error: pushErr, orderId: orderRef.id });
        }
        res.status(201).json({ order: orderResponse });
    }
    catch (error) {
        logger_1.default.error('CreateOrder error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMyOrders(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const snapshot = await firebase_1.db.collection('orders')
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
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
            };
        });
        res.json({ orders });
    }
    catch (error) {
        logger_1.default.error('GetMyOrders error', { error, userId: req.user?.userId });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getAllOrders(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status;
        const baseRef = firebase_1.db.collection('orders');
        let query;
        if (status) {
            query = baseRef.where('status', '==', status);
        }
        else {
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
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
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
    }
    catch (error) {
        logger_1.default.error('GetAllOrders error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateOrderTracking(req, res) {
    try {
        const { orderId, courierName, trackingNumber, estimatedDelivery, status } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        const orderRef = firebase_1.db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const updateData = {
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
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
        logger_1.default.info('Order tracking updated', { orderId, courierName, trackingNumber });
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
    }
    catch (error) {
        logger_1.default.error('UpdateOrderTracking error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=orderController.js.map