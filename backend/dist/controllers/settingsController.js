"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getAdminSettings = exports.getSettings = void 0;
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const localData_1 = require("../mock/localData");
const SETTINGS_DOC = 'settings/store';
function sanitizePublicSettings(settings) {
    if (!settings || typeof settings !== 'object') {
        return null;
    }
    return {
        general: {
            storeName: settings.general?.storeName ?? '',
            logo: settings.general?.logo ?? '',
            siteIcon: settings.general?.siteIcon ?? '',
            favicon: settings.general?.favicon ?? '',
            supportEmail: settings.general?.supportEmail ?? '',
            currency: settings.general?.currency ?? 'INR',
            contactPhone: settings.general?.contactPhone ?? '',
            whatsapp: settings.general?.whatsapp ?? '',
            address: settings.general?.address ?? '',
        },
        payment: {
            phonepe: {
                enabled: Boolean(settings.payment?.phonepe?.enabled),
            },
            razorpay: {
                enabled: Boolean(settings.payment?.razorpay?.enabled),
                keyId: settings.payment?.razorpay?.keyId ?? '',
            },
            cod: {
                enabled: settings.payment?.cod?.enabled !== false,
            },
        },
        shipping: {
            standardRate: settings.shipping?.standardRate ?? 0,
            freeShippingThreshold: settings.shipping?.freeShippingThreshold ?? 0,
            enableInternational: Boolean(settings.shipping?.enableInternational),
        },
        featuredCategorySections: Array.isArray(settings.featuredCategorySections) ? settings.featuredCategorySections : [],
        featuredBrandSections: Array.isArray(settings.featuredBrandSections) ? settings.featuredBrandSections : [],
        showcaseCategories: Array.isArray(settings.showcaseCategories) ? settings.showcaseCategories : [],
        showcaseBrands: Array.isArray(settings.showcaseBrands) ? settings.showcaseBrands : [],
        badges: Array.isArray(settings.badges) ? settings.badges : [],
        notifications: {
            orderConfirmation: Boolean(settings.notifications?.orderConfirmation),
            orderConfirmationMessage: settings.notifications?.orderConfirmationMessage ?? '',
            orderShipped: Boolean(settings.notifications?.orderShipped),
            orderShippedMessage: settings.notifications?.orderShippedMessage ?? '',
            orderDelivered: Boolean(settings.notifications?.orderDelivered),
            orderDeliveredMessage: settings.notifications?.orderDeliveredMessage ?? '',
            orderCancelled: Boolean(settings.notifications?.orderCancelled),
            orderCancelledMessage: settings.notifications?.orderCancelledMessage ?? '',
            welcomeEmail: Boolean(settings.notifications?.welcomeEmail),
            welcomeEmailMessage: settings.notifications?.welcomeEmailMessage ?? '',
            welcomeCouponCode: settings.notifications?.welcomeCouponCode ?? '',
            welcomeDiscount: settings.notifications?.welcomeDiscount ?? 0,
            promotional: Boolean(settings.notifications?.promotional),
            promotionalTitle: settings.notifications?.promotionalTitle ?? '',
            promotionalMessage: settings.notifications?.promotionalMessage ?? '',
            abandonedCart: Boolean(settings.notifications?.abandonedCart),
            abandonedCartMessage: settings.notifications?.abandonedCartMessage ?? '',
            abandonedCartDelay: settings.notifications?.abandonedCartDelay ?? 0,
            newsletter: Boolean(settings.notifications?.newsletter),
            newsletterTitle: settings.notifications?.newsletterTitle ?? '',
            newsletterFrequency: settings.notifications?.newsletterFrequency ?? '',
        },
    };
}
// Get store settings
const getSettings = async (req, res) => {
    try {
        if (!(0, firebase_1.isFirebaseInitialized)()) {
            res.set('Cache-Control', 'public, max-age=300, s-maxage=900');
            return res.json({ settings: sanitizePublicSettings(localData_1.mockSettings) });
        }
        const doc = await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).get());
        if (!doc.exists) {
            // Return default settings if none exist
            res.set('Cache-Control', 'public, max-age=300, s-maxage=900');
            return res.json({ settings: null });
        }
        res.set('Cache-Control', 'public, max-age=300, s-maxage=900');
        res.json({ settings: sanitizePublicSettings(doc.data()) });
    }
    catch (error) {
        logger_1.default.error('Error fetching settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to fetch settings' });
    }
};
exports.getSettings = getSettings;
const getAdminSettings = async (req, res) => {
    try {
        if (!(0, firebase_1.isFirebaseInitialized)()) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.json({ settings: localData_1.mockSettings });
        }
        const doc = await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).get());
        if (!doc.exists) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.json({ settings: null });
        }
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({ settings: doc.data() });
    }
    catch (error) {
        logger_1.default.error('Error fetching admin settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to fetch settings' });
    }
};
exports.getAdminSettings = getAdminSettings;
// Update store settings (admin only)
const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true }));
        const updated = await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).get());
        res.json({ settings: updated.data(), message: 'Settings saved successfully' });
    }
    catch (error) {
        logger_1.default.error('Error updating settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to update settings' });
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settingsController.js.map