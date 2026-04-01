"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickReorderService = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
class QuickReorderService {
    constructor() { }
    async createQuickReorder(data) {
        try {
            // Get original order
            const orderDoc = await firebase_1.db.collection('orders').doc(String(data.orderId)).get();
            if (!orderDoc.exists) {
                return { success: false, error: 'Original order not found' };
            }
            const originalOrder = orderDoc.data();
            // Check ownership
            if (originalOrder.userId !== data.userId) {
                return { success: false, error: 'Unauthorized to reorder this order' };
            }
            // Check status
            if (originalOrder.status !== 'delivered') {
                return { success: false, error: 'Only delivered orders can be reordered' };
            }
            // Prepare new order data
            const newOrderId = (0, uuid_1.v4)();
            const newOrderData = {
                id: newOrderId,
                userId: data.userId,
                status: 'pending',
                subtotal: 0, // Will recalculate
                total: 0, // Will recalculate
                discountAmount: originalOrder.discountAmount || 0, // Logic to re-apply coupon might be complex
                taxAmount: 0,
                shippingAmount: originalOrder.shippingAmount || 0,
                orderType: 'quick_reorder',
                originalOrderId: data.orderId,
                notes: data.notes || `Quick reorder from order ${data.orderId}`,
                shippingAddress: originalOrder.shippingAddress,
                billingAddress: originalOrder.billingAddress,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Handle coupon - Simplified: Re-use if valid not implemented deeply here, assuming passed or re-calc
            // In Firestore version, we might need to re-fetch coupon to check validity
            if (originalOrder.couponCode) {
                // Logic to check coupon validity would go here
                newOrderData.couponCode = originalOrder.couponCode;
            }
            // Process items
            const orderItems = [];
            let newSubtotal = 0;
            for (const originalItem of (originalOrder.items || [])) {
                let quantity = originalItem.quantity;
                const productId = originalItem.productId;
                // Apply quantity modifications
                if (data.modifyQuantities && data.quantityModifications) {
                    // Assuming orderItemId in modification refers to productId for simplicity or we match by index/id
                    const modification = data.quantityModifications.find(m => m.orderItemId === originalItem.productId || m.orderItemId === originalItem.id);
                    if (modification) {
                        quantity = modification.newQuantity;
                    }
                }
                if (quantity <= 0)
                    continue;
                // Check product stock
                const productDoc = await firebase_1.db.collection('products').doc(String(productId)).get();
                if (!productDoc.exists)
                    continue;
                const product = productDoc.data();
                if (!product.isActive)
                    continue;
                if (product.stock < quantity) {
                    quantity = product.stock; // Adjust to max available
                }
                if (quantity <= 0)
                    continue;
                const price = product.price; // Use current price
                orderItems.push({
                    productId,
                    name: product.name,
                    quantity,
                    price,
                    originalPrice: price,
                    image: product.images?.[0] || ''
                });
                newSubtotal += price * quantity;
            }
            if (orderItems.length === 0) {
                return { success: false, error: 'No items available for reorder' };
            }
            newOrderData.items = orderItems;
            newOrderData.subtotal = newSubtotal;
            // Recalculate tax/total
            newOrderData.taxAmount = newSubtotal * 0.18; // Approx tax
            newOrderData.total = newSubtotal + newOrderData.taxAmount + newOrderData.shippingAmount - newOrderData.discountAmount;
            // Save new order
            await firebase_1.db.collection('orders').doc(newOrderId).set(newOrderData);
            // Save QuickReorder tracking
            const reorderId = (0, uuid_1.v4)();
            await firebase_1.db.collection('quick_reorders').doc(reorderId).set({
                id: reorderId,
                originalOrderId: data.orderId,
                newOrderId: newOrderId,
                userId: data.userId,
                notes: data.notes,
                quantityModifications: data.modifyQuantities ? JSON.stringify(data.quantityModifications) : null,
                createdAt: new Date().toISOString(),
                status: 'pending'
            });
            return { success: true, reorder: newOrderData };
        }
        catch (error) {
            logger_1.default.error('Error creating quick reorder:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed' };
        }
    }
    async getUserReorders(userId, filters) {
        try {
            let query = firebase_1.db.collection('quick_reorders').where('userId', '==', userId);
            if (filters?.status) {
                query = query.where('status', '==', filters.status);
            }
            // Firestore offset/limit is basic
            const snapshot = await query.get(); // Get all to filter/sort in memory if needed or use composite index
            let docs = snapshot.docs.map(d => d.data());
            docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Desc
            const total = docs.length;
            if (filters?.offset)
                docs = docs.slice(filters.offset);
            if (filters?.limit)
                docs = docs.slice(0, filters.limit);
            // Fetch details (join)
            const reorders = await Promise.all(docs.map(async (reorder) => {
                const originalOrderSnap = await firebase_1.db.collection('orders').doc(String(reorder.originalOrderId)).get();
                const newOrderSnap = await firebase_1.db.collection('orders').doc(String(reorder.newOrderId)).get();
                return {
                    ...reorder,
                    originalOrder: originalOrderSnap.data(),
                    newOrder: newOrderSnap.data()
                };
            }));
            return { reorders, total };
        }
        catch (error) {
            return { reorders: [], total: 0 };
        }
    }
    async getReorderById(reorderId, userId) {
        try {
            const doc = await firebase_1.db.collection('quick_reorders').doc(reorderId).get();
            if (!doc.exists)
                return null;
            const data = doc.data();
            if (data.userId !== userId)
                return null;
            const originalOrderSnap = await firebase_1.db.collection('orders').doc(String(data.originalOrderId)).get();
            const newOrderSnap = await firebase_1.db.collection('orders').doc(String(data.newOrderId)).get();
            return {
                ...data,
                originalOrder: originalOrderSnap.data(),
                newOrder: newOrderSnap.data()
            };
        }
        catch (error) {
            return null;
        }
    }
    async cancelReorder(reorderId, userId, reason) {
        try {
            const docRef = firebase_1.db.collection('quick_reorders').doc(reorderId);
            const doc = await docRef.get();
            if (!doc.exists)
                return { success: false, error: 'Not found' };
            const data = doc.data();
            if (data.userId !== userId)
                return { success: false, error: 'Unauthorized' };
            const newOrderRef = firebase_1.db.collection('orders').doc(data.newOrderId);
            const newOrderDoc = await newOrderRef.get();
            const newOrder = newOrderDoc.data();
            if (newOrder.status !== 'pending')
                return { success: false, error: 'Can only cancel pending' };
            // Update order
            await newOrderRef.update({
                status: 'cancelled',
                cancellationReason: reason,
                cancelledAt: new Date().toISOString()
            });
            // Update reorder
            await docRef.update({
                status: 'cancelled',
                cancellationReason: reason,
                cancelledAt: new Date().toISOString()
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
    async getReorderStats(userId) {
        // Mock stats or aggregate from Firestore
        return {
            totalReorders: 0,
            successfulReorders: 0,
            cancelledReorders: 0,
            pendingReorders: 0,
            averageOrderValue: 0,
            mostReorderedProducts: []
        };
    }
    async getRecommendedReorders(userId, limit = 5) {
        try {
            const ordersSnap = await firebase_1.db.collection('orders').where('userId', '==', userId).where('status', '==', 'delivered').get();
            const productCounts = {};
            ordersSnap.forEach(doc => {
                const order = doc.data();
                (order.items || []).forEach((item) => {
                    if (!productCounts[item.productId]) {
                        productCounts[item.productId] = { ...item, count: 0, lastOrdered: order.createdAt };
                    }
                    productCounts[item.productId].count++;
                    if (order.createdAt > productCounts[item.productId].lastOrdered) {
                        productCounts[item.productId].lastOrdered = order.createdAt;
                    }
                });
            });
            return Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        }
        catch (error) {
            return [];
        }
    }
}
exports.QuickReorderService = QuickReorderService;
exports.default = QuickReorderService;
//# sourceMappingURL=quickReorderService.js.map