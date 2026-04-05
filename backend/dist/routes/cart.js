"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// Save cart for logged-in user
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }
        const cartRef = firebase_1.db.collection('carts').doc(userId);
        await cartRef.set({
            items,
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        logger_1.default.info('Cart saved', { userId, itemCount: items.length });
        res.json({ success: true, message: 'Cart saved' });
    }
    catch (error) {
        logger_1.default.error('Save cart error', { error });
        res.status(500).json({ error: 'Failed to save cart' });
    }
});
// Get cart for logged-in user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const cartDoc = await (0, firebase_1.withTimeout)(firebase_1.db.collection('carts').doc(userId).get(), 10000);
        if (!cartDoc.exists) {
            return res.json({ items: [] });
        }
        const cartData = cartDoc.data();
        res.json({ items: cartData.items || [] });
    }
    catch (error) {
        logger_1.default.error('Get cart error', { error });
        res.status(500).json({ error: 'Failed to get cart' });
    }
});
// Merge local cart with server cart
router.post('/merge', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { localItems } = req.body;
        if (!localItems || !Array.isArray(localItems)) {
            return res.status(400).json({ error: 'Invalid local items' });
        }
        const cartRef = firebase_1.db.collection('carts').doc(userId);
        const cartDoc = await (0, firebase_1.withTimeout)(cartRef.get(), 10000);
        let serverItems = [];
        if (cartDoc.exists) {
            const cartData = cartDoc.data();
            serverItems = cartData.items || [];
        }
        // Merge logic: local items take precedence, add new server items
        const mergedItems = [...serverItems];
        for (const localItem of localItems) {
            const existingIndex = mergedItems.findIndex(item => item.productId === localItem.productId &&
                JSON.stringify(item.selectedAttributes) === JSON.stringify(localItem.selectedAttributes));
            if (existingIndex >= 0) {
                // Update quantity
                mergedItems[existingIndex].quantity += localItem.quantity;
            }
            else {
                // Add new item
                mergedItems.push(localItem);
            }
        }
        // Save merged cart
        await cartRef.set({
            items: mergedItems,
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        logger_1.default.info('Cart merged', { userId, itemCount: mergedItems.length });
        res.json({ items: mergedItems });
    }
    catch (error) {
        logger_1.default.error('Merge cart error', { error });
        res.status(500).json({ error: 'Failed to merge cart' });
    }
});
// Clear cart
router.delete('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        await (0, firebase_1.withTimeout)(firebase_1.db.collection('carts').doc(userId).delete(), 10000);
        logger_1.default.info('Cart cleared', { userId });
        res.json({ success: true, message: 'Cart cleared' });
    }
    catch (error) {
        logger_1.default.error('Clear cart error', { error });
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map