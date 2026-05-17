import { Router, Request, Response } from 'express';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { admin, db } from '../config/firebase';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

dotenv.config();

const router = Router();

const WP_URL = (process.env.WP_URL || "https://alphadentkart.com").replace(/\/$/, '');
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY;
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET;

const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;
const api = new (WC as any)({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: { timeout: 60000 }
});

const BATCH_SIZE = 100;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAll(endpoint: string, params: Record<string, any> = {}): Promise<any[]> {
    let page = 1;
    let results: any[] = [];
    let totalPages = 1;

    try {
        do {
            const { data, headers } = await api.get(endpoint, { ...params, per_page: BATCH_SIZE, page });
            if (data && Array.isArray(data)) {
                results = results.concat(data);
            }
            totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
            page++;
            if (page <= totalPages) await sleep(100);
        } while (page <= totalPages);
    } catch (error: any) {
        logger.error(`Error fetching from ${endpoint}:`, { error: error?.response?.data || error?.message });
        throw error;
    }

    return results;
}

async function getLastSyncTime(type: string): Promise<Date | null> {
    try {
        const doc = await db.collection('settings').doc('sync_status').get();
        if (doc.exists) {
            const data = doc.data();
            if (data && data[type]) {
                const timestamp = data[type];
                return typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
            }
        }
    } catch (e) {
    } catch (e) {
        logger.warn(`Could not fetch last sync time for ${type}`, { error: e });
    }
    return null;
}

async function updateLastSyncTime(type: string, time: Date = new Date()) {
    try {
        await db.collection('settings').doc('sync_status').set({
            [type]: admin.firestore.Timestamp.fromDate(time),
            [`${type}_last_success`]: admin.firestore.Timestamp.fromDate(new Date())
        }, { merge: true });
    } catch (e) {
    } catch (e) {
        logger.error(`Failed to update last sync time for ${type}`, { error: e });
    }
}

async function syncProducts(forceFull = false): Promise<number> {
    logger.info("📦 Fetching products from WooCommerce...");
    
    const params: any = { status: "publish,private,draft" };
    const lastSync = !forceFull ? await getLastSyncTime('lastProductSync') : null;
    
    if (lastSync) {
        // Go back 10 minutes to handle overlaps/clock drift
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching products modified after ${params.after}`);
    }

    const products = await fetchAll("/products", params);
    logger.info(`Found ${products.length} products to sync`);

    if (products.length === 0) return 0;

    let synced = 0;
    const getOriginalImageUrl = (url: string): string => {
        if (!url) return '';
        return url.replace(/-(\d+)x(\d+)\.(\w+)$/, '.$3');
    };

    // Parallel processing with limited concurrency for variations
    const processBatch = async (items: any[]) => {
        const batch = db.batch();
        
        // Pre-fetch all variations in parallel for variable products in this batch
        const variableItems = items.filter(p => p.type === 'variable');
        const variationsMap = new Map<number, any[]>();
        
        if (variableItems.length > 0) {
            logger.info(`   ↳ Parallel fetching variations for ${variableItems.length} products...`);
            // Fetch variations with concurrency limit of 5
            for (let i = 0; i < variableItems.length; i += 5) {
                const chunk = variableItems.slice(i, i + 5);
                await Promise.all(chunk.map(async (p) => {
                    try {
                        const vars = await fetchAll(`/products/${p.id}/variations`);
                        variationsMap.set(p.id, vars);
                    } catch (err) {
                        logger.warn(`      ⚠️ Failed variations for ${p.id}`, { error: err });
                    }
                }));
            }
        }

        for (const product of items) {
            const imageUrls = product.images?.map((img: any) => getOriginalImageUrl(img.src)) || [];
            const variations: any[] = [];
            
            const fetchedVars = variationsMap.get(product.id);
            if (fetchedVars) {
                variations.push(...fetchedVars.map((v: any) => ({
                    id: String(v.id),
                    price: parseFloat(v.price) || 0,
                    regularPrice: parseFloat(v.regular_price) || 0,
                    salePrice: parseFloat(v.sale_price) || null,
                    stock: v.manage_stock ? (v.stock_quantity ?? 0) : (v.stock_status === 'instock' ? 999 : 0),
                    stockStatus: v.stock_status,
                    sku: v.sku || '',
                    image: v.image?.src || '',
                    attributes: v.attributes || []
                })));
            }

            const brandName = product.brands?.[0]?.name || 
                            product.attributes?.find((a: any) => a.slug === 'pa_brand' || a.name.toLowerCase() === 'brand')?.options?.[0] ||
                            product.tags?.[0]?.name || '';

            const productData = {
                wpId: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDescription: product.short_description,
                price: parseFloat(product.price) || 0,
                salePrice: parseFloat(product.sale_price) || parseFloat(product.price) || 0,
                originalPrice: parseFloat(product.regular_price) || parseFloat(product.price) || 0,
                stock: product.manage_stock ? (product.stock_quantity ?? 0) : (product.stock_status === 'instock' ? 999 : 0),
                stockStatus: product.stock_status,
                sku: product.sku || '',
                image: imageUrls[0] || '',
                images: imageUrls,
                category: product.categories?.[0]?.name || 'Dental',
                categoryId: product.categories?.[0]?.id || null,
                brand: brandName,
                type: product.type,
                status: product.status,
                createdAt: new Date(product.date_created),
                updatedAt: new Date(product.date_modified),
                lastSync: new Date(),
                reviews: product.rating_count || 0,
                rating: parseFloat(product.average_rating) || 0,
                specs: {
                    weight: product.weight || '',
                    dimensions: product.dimensions || {},
                    sku: product.sku || '',
                    manageStock: product.manage_stock
                },
                features: [],
                attributes: product.attributes || [],
                variations: variations,
                source: 'wordpress_sync'
            };

            const productRef = db.collection('products').doc(String(product.id));
            batch.set(productRef, productData, { merge: true });
        }
        
        await batch.commit();
    };

    // Process all products in batches of 50
        const chunk = products.slice(i, i + 50);
        await processBatch(chunk);
        synced += chunk.length;
        logger.info(`Synced ${synced}/${products.length} products`);
        await sleep(200);
    }

    await updateLastSyncTime('lastProductSync');
    return synced;
}

async function syncOrders(forceFull = false): Promise<number> {
    logger.info("📋 Fetching orders from WooCommerce...");
    
    const params: any = { per_page: 100 };
    const lastSync = !forceFull ? await getLastSyncTime('lastOrderSync') : null;
    
    if (lastSync) {
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching orders modified after ${params.after}`);
    }

    const orders = await fetchAll("/orders", params);
    logger.info(`Found ${orders.length} orders to sync`);

    if (orders.length === 0) return 0;

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const order of orders) {
        const customer = order.billing;
        const orderData = {
            wpId: order.id,
            orderNumber: order.number,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingAddress: {
                firstName: customer.first_name,
                lastName: customer.last_name,
                address1: customer.address_1,
                address2: customer.address_2,
                city: customer.city,
                state: customer.state,
                postcode: customer.postcode,
                country: customer.country
            },
            billingAddress: {
                firstName: customer.first_name,
                lastName: customer.last_name,
                address1: customer.address_1,
                address2: customer.address_2,
                city: customer.city,
                state: customer.state,
                postcode: customer.postcode,
                country: customer.country
            },
            items: order.line_items.map((item: any) => ({
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            })),
            subtotal: parseFloat(order.subtotal),
            shipping: parseFloat(order.shipping_total),
            tax: parseFloat(order.total_tax),
            total: parseFloat(order.total),
            status: order.status === 'processing' ? 'pending' : order.status === 'completed' ? 'delivered' : order.status,
            paymentMethod: order.payment_method_title,
            paymentStatus: order.payment_status === 'paid' ? 'paid' : 'pending',
            createdAt: new Date(order.date_created),
            updatedAt: new Date(order.date_modified),
            lastSync: new Date(),
            source: 'wordpress_sync'
        };

        const orderRef = db.collection('orders').doc(String(order.id));
        batch.set(orderRef, orderData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            batch = db.batch();
            countInBatch = 0;
            await sleep(200);
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    await updateLastSyncTime('lastOrderSync');
    return synced;
}

async function syncUsers(forceFull = false): Promise<number> {
    logger.info("👥 Fetching customers from WooCommerce...");
    
    const params: any = { per_page: 100 };
    const lastSync = !forceFull ? await getLastSyncTime('lastUserSync') : null;
    
    if (lastSync) {
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching users modified after ${params.after}`);
    }

    const customers = await fetchAll("/customers", params);
    logger.info(`Found ${customers.length} customers to sync`);

    if (customers.length === 0) return 0;

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const customer of customers) {
        const billing = customer.billing;
        const userData = {
            wpId: customer.id,
            email: customer.email,
            name: `${customer.first_name} ${customer.last_name}`,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: billing?.phone || '',
            addresses: [{
                type: 'billing',
                firstName: billing?.first_name || '',
                lastName: billing?.last_name || '',
                address1: billing?.address_1 || '',
                address2: billing?.address_2 || '',
                city: billing?.city || '',
                state: billing?.state || '',
                postcode: billing?.postcode || '',
                country: billing?.country || '',
                phone: billing?.phone || ''
            }],
            role: 'customer',
            isVerified: true,
            createdAt: new Date(customer.date_created),
            lastSync: new Date(),
            source: 'wordpress_sync'
        };

        const userRef = db.collection('users').doc(String(customer.id));
        batch.set(userRef, userData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            batch = db.batch();
            countInBatch = 0;
            await sleep(200);
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    await updateLastSyncTime('lastUserSync');
    return synced;
}

async function syncCategories(): Promise<number> {
    logger.info("📂 Fetching categories from WooCommerce...");
    const categories = await fetchAll("/products/categories", { per_page: 100 });
    logger.info(`Found ${categories.length} categories`);

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const cat of categories) {
        const categoryData = {
            wpId: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image?.src || '',
            parent: cat.parent || 0,
            count: cat.count || 0,
            lastSync: new Date(),
            updatedAt: new Date(),
            source: 'wordpress_sync'
        };

        const catRef = db.collection('categories').doc(String(cat.id));
        batch.set(catRef, categoryData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            logger.info(`Synced ${synced}/${categories.length} categories`);
            batch = db.batch();
            countInBatch = 0;
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    logger.info(`✅ Synced ${synced} categories`);
    return synced;
}

async function searchBrandLogo(brandName: string): Promise<string> {
    const cleanName = brandName.replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const searchTerms = [
        cleanName + '+logo',
        cleanName.replace(/\s+/g, '-') + '-logo',
        cleanName.replace(/\s+/g, '_') + '_logo'
    ];

    for (const term of searchTerms) {
        try {
            const { data } = await api.get('/wp/v2/media', { search: term, per_page: 1 });
            if (data && data.length > 0 && data[0].source_url) {
                return data[0].source_url;
            }
        } catch (e) {
            // Ignore errors, try next term
        }
    }
    return '';
}

async function syncBrands(): Promise<number> {
    logger.info("🏷️ Fetching tags (brands) from WooCommerce...");
    const tags = await fetchAll("/products/tags", { per_page: 100 });
    logger.info(`Found ${tags.length} tags in WooCommerce`);
    
    // Also try to fetch from pa_brand attribute if available
    let brandsFromAttr: any[] = [];
    try {
        logger.info("🏷️ Checking for pa_brand attribute terms...");
        const { data: attributes } = await api.get("products/attributes");
        const brandAttr = attributes.find((a: any) => 
            a.slug === "pa_brand" || a.slug === "brand" || a.name.toLowerCase() === "brand"
        );
        if (brandAttr) {
            brandsFromAttr = await fetchAll(`products/attributes/${brandAttr.id}/terms`);
            logger.info(`Found ${brandsFromAttr.length} brand terms in attributes`);
        }
    } catch (err) {
        logger.info("   ⏭️ pa_brand attribute not found or inaccessible");
    }

    const allBrandTerms = [...tags, ...brandsFromAttr];
    const uniqueBrands = Array.from(new Map(allBrandTerms.map(item => [item.name, item])).values());
    logger.info(`Processing ${uniqueBrands.length} unique brands`);

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const brand of uniqueBrands) {
        const brandData = {
            wpId: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description || '',
            image: brand.image?.src || '',
            count: brand.count || 0,
            lastSync: new Date(),
            updatedAt: new Date(),
            source: 'wordpress_sync'
        };

        const brandRef = db.collection('brands').doc(String(brand.id));
        batch.set(brandRef, brandData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            logger.info(`Synced ${synced}/${uniqueBrands.length} brands`);
            batch = db.batch();
            countInBatch = 0;
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    logger.info(`✅ Synced ${synced} brands`);
    return synced;
}

router.post('/products', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting product sync (forceFull: ${forceFull})...`);
        const synced = await syncProducts(forceFull);
        res.json({ success: true, synced, message: `Synced ${synced} products from WordPress` });
    } catch (error: any) {
        logger.error('Product sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/orders', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting order sync (forceFull: ${forceFull})...`);
        const synced = await syncOrders(forceFull);
        res.json({ success: true, synced, message: `Synced ${synced} orders from WordPress` });
    } catch (error: any) {
        logger.error('Order sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/users', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting user sync (forceFull: ${forceFull})...`);
        const synced = await syncUsers(forceFull);
        res.json({ success: true, synced, message: `Synced ${synced} users from WordPress` });
    } catch (error: any) {
        logger.error('User sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/categories', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        logger.info("Starting category sync...");
        const synced = await syncCategories();
        res.json({ success: true, synced, message: `Synced ${synced} categories from WordPress` });
    } catch (error: any) {
        logger.error('Category sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/brands', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        logger.info("Starting brand sync...");
        const synced = await syncBrands();
        res.json({ success: true, synced, message: `Synced ${synced} brands from WordPress` });
    } catch (error: any) {
        logger.error('Brand sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/full', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting full sync (forceFull: ${forceFull})...`);
        
        // Use Promise.all for independent syncs to improve speed
        // but keep products and orders separate to avoid overwhelming the API
        const categoriesSynced = await syncCategories();
        const brandsSynced = await syncBrands();
        
        logger.info("Starting products sync...");
        const productsSynced = await syncProducts(forceFull);
        
        logger.info("Starting orders and users sync...");
        const [ordersSynced, usersSynced] = await Promise.all([
            syncOrders(forceFull),
            syncUsers(forceFull)
        ]);

        res.json({
            success: true,
            categories: categoriesSynced,
            brands: brandsSynced,
            products: productsSynced,
            orders: ordersSynced,
            users: usersSynced,
            message: 'Full sync completed successfully'
        });
    } catch (error: any) {
        logger.error('Full sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

export default router;