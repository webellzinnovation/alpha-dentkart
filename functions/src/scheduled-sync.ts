import { onSchedule } from "firebase-functions/v2/scheduler";
import { getWooClient, syncProducts, syncOrders, syncUsers, syncCategories, syncBrands, updateBrandProductCounts } from "./routes/sync";
import { cacheService } from "./services/cacheService";
import logger from "./utils/logger";
import { db } from "./config/firebase";

async function runFullSync(forceFull = false): Promise<{
    success: boolean;
    results: Record<string, number>;
    errors: string[];
}> {
    const results: Record<string, number> = { categories: 0, brands: 0, products: 0, orders: 0, users: 0 };
    const errors: string[] = [];

    const api = await getWooClient();

    // Categories + Brands first (products depend on them)
    try { results.categories = await syncCategories(api); } catch (e: any) {
        errors.push('categories: ' + (e?.message || 'unknown'));
        logger.error('[scheduled-sync] Category sync failed', { error: e });
    }
    try { results.brands = await syncBrands(api); } catch (e: any) {
        errors.push('brands: ' + (e?.message || 'unknown'));
        logger.error('[scheduled-sync] Brand sync failed', { error: e });
    }

    // Products
    try { results.products = await syncProducts(api, forceFull); } catch (e: any) {
        errors.push('products: ' + (e?.message || 'unknown'));
        logger.error('[scheduled-sync] Product sync failed', { error: e });
    }

    // Orders + Users in parallel
    try {
        const [ordersSynced, usersSynced] = await Promise.all([
            syncOrders(api, forceFull).catch(e => { errors.push('orders: ' + (e?.message || 'unknown')); return 0; }),
            syncUsers(api, forceFull).catch(e => { errors.push('users: ' + (e?.message || 'unknown')); return 0; })
        ]);
        results.orders = ordersSynced;
        results.users = usersSynced;
    } catch (e: any) {
        errors.push('orders/users: ' + (e?.message || 'unknown'));
    }

    // Invalidate caches
    try {
        await Promise.all([
            cacheService.invalidateProductsCache(),
            cacheService.invalidateCategoriesCache(),
            cacheService.invalidateBrandsCache()
        ]);
    } catch (e) {
        logger.warn('[scheduled-sync] Cache invalidation failed', { error: e });
    }

    // Recalculate brand product counts
    try { await updateBrandProductCounts(); } catch (e) {
        logger.warn('[scheduled-sync] Brand count update failed', { error: e });
    }

    // Write sync status to Firestore for the admin dashboard
    try {
        const now = new Date();
        await db.collection('settings').doc('sync_status').set({
            lastProductSync: now,
            lastOrderSync: now,
            lastUserSync: now,
            lastFullSync: now,
            lastScheduledSync: now,
            scheduledSyncResults: results,
            scheduledSyncErrors: errors.length > 0 ? errors : null,
        }, { merge: true });
    } catch (e) {
        logger.warn('[scheduled-sync] Failed to write sync status', { error: e });
    }

    return { success: errors.length === 0, results, errors };
}

// Daily incremental sync at 4:00 AM IST
export const scheduledSyncDaily = onSchedule(
    {
        schedule: "0 4 * * *",
        timeZone: "Asia/Kolkata",
        region: "asia-south1",
        timeoutSeconds: 540,
        memory: "512MiB",
    },
    async (_event) => {
        logger.info("[scheduled-sync] Starting daily incremental sync");
        const { success, results, errors } = await runFullSync(false);
        logger.info(`[scheduled-sync] Daily sync completed`, { success, results, errors });
    }
);

// Weekly full sync every Sunday at 3:00 AM IST
export const scheduledSyncWeekly = onSchedule(
    {
        schedule: "0 3 * * 0",
        timeZone: "Asia/Kolkata",
        region: "asia-south1",
        timeoutSeconds: 540,
        memory: "1GiB",
    },
    async (_event) => {
        logger.info("[scheduled-sync] Starting weekly FULL sync");
        const { success, results, errors } = await runFullSync(true);
        logger.info(`[scheduled-sync] Weekly sync completed`, { success, results, errors });
    }
);
