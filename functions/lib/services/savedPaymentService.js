"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPaymentService = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const crypto_1 = require("crypto");
const logger_1 = __importDefault(require("../utils/logger"));
class SavedPaymentService {
    constructor() { }
    async savePaymentMethod(data) {
        try {
            // If default, unset others
            if (data.isDefault) {
                const batch = firebase_1.db.batch();
                const otherDefaults = await firebase_1.db.collection('saved_payment_methods')
                    .where('userId', '==', data.userId)
                    .where('isDefault', '==', true)
                    .get();
                otherDefaults.forEach(doc => {
                    batch.update(doc.ref, { isDefault: false });
                });
                await batch.commit();
            }
            const id = (0, crypto_1.randomUUID)();
            const paymentData = {
                id,
                ...data,
                isDefault: data.isDefault || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await firebase_1.db.collection('saved_payment_methods').doc(id).set(paymentData);
            return { success: true, paymentMethod: paymentData };
        }
        catch (error) {
            logger_1.default.error('Error saving payment method:', error);
            return { success: false, error: 'Failed to save payment method' };
        }
    }
    async getUserPaymentMethods(userId) {
        try {
            const snapshot = await firebase_1.db.collection('saved_payment_methods')
                .where('userId', '==', userId)
                //.orderBy('isDefault', 'desc') // Requires composite index if multiple fields
                .get();
            const methods = snapshot.docs.map(doc => doc.data());
            // Sort in memory to avoid index requirement for now
            methods.sort((a, b) => (b.isDefault === a.isDefault ? 0 : b.isDefault ? 1 : -1));
            return methods;
        }
        catch (error) {
            return [];
        }
    }
    async getPaymentMethodById(id, userId) {
        try {
            const doc = await firebase_1.db.collection('saved_payment_methods').doc(String(id)).get();
            if (!doc.exists)
                return null;
            const data = doc.data();
            if (data.userId !== userId)
                return null;
            return data;
        }
        catch (error) {
            return null;
        }
    }
    async updatePaymentMethod(id, userId, updates) {
        try {
            const docRef = firebase_1.db.collection('saved_payment_methods').doc(String(id));
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== userId)
                return { success: false, error: 'Not found' };
            if (updates.isDefault) {
                const batch = firebase_1.db.batch();
                const otherDefaults = await firebase_1.db.collection('saved_payment_methods')
                    .where('userId', '==', userId)
                    .where('isDefault', '==', true)
                    .get();
                otherDefaults.forEach(d => {
                    if (d.id !== id)
                        batch.update(d.ref, { isDefault: false });
                });
                await batch.commit();
            }
            await docRef.update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return { success: true, paymentMethod: { ...(doc.data()), ...updates } };
        }
        catch (error) {
            return { success: false, error: 'Failed to update' };
        }
    }
    async deletePaymentMethod(id, userId) {
        try {
            const docRef = firebase_1.db.collection('saved_payment_methods').doc(String(id));
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== userId)
                return { success: false, error: 'Not found' };
            const wasDefault = doc.data()?.isDefault;
            await docRef.delete();
            if (wasDefault) {
                const snapshot = await firebase_1.db.collection('saved_payment_methods')
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();
                if (!snapshot.empty) {
                    await snapshot.docs[0].ref.update({ isDefault: true });
                }
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
    async setDefaultPaymentMethod(id, userId) {
        try {
            const batch = firebase_1.db.batch();
            const allDocs = await firebase_1.db.collection('saved_payment_methods').where('userId', '==', userId).get();
            let found = false;
            allDocs.forEach(doc => {
                if (doc.id === id) {
                    batch.update(doc.ref, { isDefault: true, updatedAt: new Date().toISOString() });
                    found = true;
                }
                else if (doc.data().isDefault) {
                    batch.update(doc.ref, { isDefault: false });
                }
            });
            if (!found)
                return { success: false, error: 'Not found' };
            await batch.commit();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
    async getDefaultPaymentMethod(userId) {
        try {
            const snapshot = await firebase_1.db.collection('saved_payment_methods')
                .where('userId', '==', userId)
                .where('isDefault', '==', true)
                .limit(1)
                .get();
            if (snapshot.empty)
                return null;
            return snapshot.docs[0].data();
        }
        catch (error) {
            return null;
        }
    }
    async getPaymentMethodsByGateway(userId, gateway) {
        try {
            const snapshot = await firebase_1.db.collection('saved_payment_methods')
                .where('userId', '==', userId)
                .where('gateway', '==', gateway)
                .get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            return [];
        }
    }
    async validatePaymentToken(token, gateway) {
        // Mock validation logic
        if (gateway === 'razorpay') {
            return { isValid: true, last4: token.slice(-4), brand: 'VISA', expiry: '12/25' };
        }
        return { isValid: true };
    }
    async getPaymentMethodStats(userId) {
        // Mock or basic aggregation
        return {
            totalMethods: 0,
            byType: {},
            byGateway: {},
            defaultMethod: null
        };
    }
}
exports.SavedPaymentService = SavedPaymentService;
exports.default = SavedPaymentService;
//# sourceMappingURL=savedPaymentService.js.map