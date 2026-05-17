import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';
import { cacheService } from '../services/cacheService';

export async function getAdminStats(req: Request, res: Response) {
    try {
        // Try caching to avoid repeated count queries
        const cacheKey = 'admin:stats:overview';
        const cached = await cacheService.get(cacheKey);

        if (cached) {
            return res.json(cached);
        }

        // Parallel queries for performance
        const [productsSnapshot, ordersSnapshot, usersSnapshot] = await Promise.all([
            db.collection('products').count().get(),
            db.collection('orders').count().get(),
            db.collection('users').count().get()
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
            const allOrders = await db.collection('orders').select('total').get();
            totalRevenue = allOrders.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
        } catch (e) {
            logger.warn("Failed to aggregate revenue", { error: e });
        }

        const stats = {
            totalProducts,
            totalOrders,
            totalCustomers,
            totalRevenue
        };

        // Cache for 5 minutes
        await cacheService.set(cacheKey, stats, 300);

        return res.json(stats);
    } catch (error) {
        logger.error('Error fetching admin stats:', error);
        return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
}
