"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
const cacheService_1 = require("../services/cacheService");
async function getAdminStats(req, res) {
    try {
        // Try caching to avoid repeated count queries
        const cacheKey = 'admin:stats:overview';
        const cached = await cacheService_1.cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        console.log('Fetching real admin stats from Firestore...');
        // Parallel queries for performance
        const [productsSnapshot, ordersSnapshot, usersSnapshot] = await Promise.all([
            firebase_1.db.collection('products').count().get(),
            firebase_1.db.collection('orders').count().get(),
            firebase_1.db.collection('users').count().get()
        ]);
        const totalProducts = productsSnapshot.data().count;
        const totalOrders = ordersSnapshot.data().count;
        const totalCustomers = usersSnapshot.data().count;
        // Calculate Revenue (Basic implementation - sums up all orders 'total' field)
        // Note: In production, revenue aggregation should be handled by a scheduled cloud function
        let totalRevenue = 0;
        try {
            // Get all orders to calculate revenue (simplified for demo)
            // Realistically, you would paginate this or use an aggregation pipeline
            const allOrders = await firebase_1.db.collection('orders').select('total').get();
            totalRevenue = allOrders.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
        }
        catch (e) {
            console.warn("Failed to aggregate revenue", e);
        }
        const stats = {
            totalProducts,
            totalOrders,
            totalCustomers,
            totalRevenue
        };
        // Cache for 5 minutes
        await cacheService_1.cacheService.set(cacheKey, stats, 300);
        return res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Error fetching admin stats:', error);
        return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
}
//# sourceMappingURL=adminStatsController.js.map