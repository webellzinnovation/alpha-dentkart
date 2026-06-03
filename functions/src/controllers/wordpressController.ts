import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';
import logger from '../utils/logger';

function getWooConfig() {
    return {
        siteUrl: process.env.WC_SITE_URL || '',
        consumerKey: process.env.WC_CONSUMER_KEY || '',
        consumerSecret: process.env.WC_CONSUMER_SECRET || '',
    };
}

async function fetchWooPaginated(endpoint: string, params: Record<string, any> = {}): Promise<any[]> {
    const { siteUrl, consumerKey, consumerSecret } = getWooConfig();
    if (!siteUrl) throw new Error('WordPress site URL not configured');
    const baseUrl = siteUrl.replace(/\/$/, '') + '/wp-json/wc/v3/' + endpoint.replace(/^\//, '');
    const allResults: any[] = [];
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
        const url = new URL(baseUrl);
        url.searchParams.set('consumer_key', consumerKey);
        url.searchParams.set('consumer_secret', consumerSecret);
        url.searchParams.set('per_page', '100');
        url.searchParams.set('page', page.toString());
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
        const response = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) throw new Error('WooCommerce API error (' + response.status + '): ' + await response.text());
        const data = await response.json();
        allResults.push(...data);
        const tp = response.headers.get('x-wp-totalpages');
        totalPages = tp ? parseInt(tp, 10) : 1;
        page++;
    }
    return allResults;
}

async function batchWrite(collection: string, items: any[], idFn: (item: any) => string): Promise<number> {
    if (items.length === 0) return 0;
    let count = 0;
    for (let i = 0; i < items.length; i += 450) {
        const batch = db.batch();
        const chunk = items.slice(i, i + 450);
        for (const item of chunk) {
            batch.set(db.collection(collection).doc(idFn(item)), { ...item, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            count++;
        }
        await batch.commit();
    }
    return count;
}

async function updateSyncStatus(status: any): Promise<void> {
    await db.collection('settings').doc('wordpress_sync').set(status, { merge: true });
}

function mapWooStatus(s: string): string {
    const m: Record<string, string> = { pending: 'Processing', processing: 'Processing', 'on-hold': 'Processing', completed: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded', failed: 'Failed' };
    return m[s] || 'Processing';
}

export async function testConnection(req: Request, res: Response) {
    try {
        const siteUrl = req.body.siteUrl || req.body.url || process.env.WC_SITE_URL;
        const consumerKey = req.body.consumerKey || process.env.WC_CONSUMER_KEY;
        const consumerSecret = req.body.consumerSecret || process.env.WC_CONSUMER_SECRET;

        if (!siteUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ error: 'WordPress site URL and API credentials are required' });
        }

        const cleanSiteUrl = siteUrl.replace(/\/$/, '');
        const url = `${cleanSiteUrl}/wp-json/wc/v3/system_status?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const response = await fetch(url);
        
        const responseText = await response.text();
        let data: any = null;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // Not JSON
        }

        if (!response.ok) {
            let errorMessage = data?.message || `Connection failed (${response.status})`;
            if (!data) {
                errorMessage = responseText.substring(0, 150) || errorMessage;
            }
            return res.status(response.status).json({ connected: false, error: errorMessage });
        }

        if (!data) {
            return res.status(500).json({ 
                connected: false, 
                error: 'Invalid response from WooCommerce API (not JSON). Please check your Site URL.' 
            });
        }

        res.json({ 
            connected: true, 
            siteName: data.store_name || 'Unknown', 
            wcVersion: data.wc_version, 
            wpVersion: data.wp_version 
        });
    } catch (error: any) {
        logger.error('WooCommerce Connection Error', { error: error.message });
        res.status(500).json({ connected: false, error: 'Failed to connect to WooCommerce' });
    }
}

export async function syncProducts(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        const products = await fetchWooPaginated('products', { status: 'publish' });
        const mapped = products.map((p: any) => ({
            wpId: p.id, name: p.name, slug: p.slug, description: p.description || '',
            shortDescription: p.short_description || '', price: parseFloat(p.price) || 0,
            originalPrice: parseFloat(p.regular_price) || parseFloat(p.price) || 0,
            salePrice: p.sale_price ? parseFloat(p.sale_price) : null, sku: p.sku || '',
            stock: p.stock_quantity || (p.manage_stock ? 0 : 10), manageStock: p.manage_stock || false,
            stockStatus: p.stock_status || 'instock', image: (p.images && p.images[0]) ? p.images[0].src : '',
            images: (p.images || []).map((img: any) => img.src),
            category: (p.categories && p.categories[0]) ? p.categories[0].name : 'General',
            categoryId: (p.categories && p.categories[0]) ? p.categories[0].id : null,
            brand: (p.attributes || []).find((a: any) => a.name && a.name.toLowerCase() === 'brand') ? (p.attributes.find((a: any) => a.name.toLowerCase() === 'brand').options || [])[0] || '' : '',
            categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
            attributes: (p.attributes || []).map((a: any) => ({ id: a.id, name: a.name, options: a.options })),
            variations: p.variations || [], weight: p.weight || '', dimensions: p.dimensions || {},
            type: p.type || 'simple', featured: p.featured || false, rating: parseFloat(p.average_rating) || 0,
            reviews: p.rating_count || 0, status: p.status || 'publish', source: 'woocommerce',
        }));
        const written = await batchWrite('products', mapped, (d) => 'wp-' + d.wpId);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.products': written });
        res.json({ success: true, count: written, type: 'products' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncCategories(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        const categories = await fetchWooPaginated('products/categories');
        const mapped = categories.map((c: any) => ({
            wpId: c.id, name: c.name, slug: c.slug, description: c.description || '',
            image: c.image ? c.image.src : '', parent: c.parent || 0, count: c.count || 0, source: 'woocommerce',
        }));
        const written = await batchWrite('categories', mapped, (d) => 'wp-' + d.wpId);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.categories': written });
        res.json({ success: true, count: written, type: 'categories' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncBrands(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        let brands: any[] = [];
        try {
            brands = await fetchWooPaginated('products/attributes');
            const ba = brands.find((a: any) => a.name && a.name.toLowerCase() === 'brand');
            if (ba) brands = await fetchWooPaginated('products/attributes/' + ba.id + '/terms');
        } catch { try { brands = await fetchWooPaginated('brands'); } catch { } }
        if (brands.length === 0) {
            const products = await fetchWooPaginated('products', { status: 'publish' });
            const bs = new Map<string, any>();
            for (const p of products) {
                const ba = (p.attributes || []).find((a: any) => a.name && a.name.toLowerCase() === 'brand');
                if (ba && ba.options) {
                    for (const bn of ba.options) {
                        if (!bs.has(bn)) bs.set(bn, { name: bn, slug: bn.toLowerCase().replace(/\s+/g, '-'), productCount: 0 });
                        const entry = bs.get(bn);
                        if (entry) entry.productCount++;
                    }
                }
            }
            brands = Array.from(bs.values());
        }
        const mapped = brands.map((b: any) => ({
            wpId: b.id || null, name: b.name, slug: b.slug || b.name.toLowerCase().replace(/\s+/g, '-'),
            description: b.description || '', image: b.image ? (b.image.src || b.image) : '',
            productCount: b.count || b.productCount || 0, source: 'woocommerce',
        }));
        const written = await batchWrite('brands', mapped, (d) => d.wpId ? 'wp-' + d.wpId : 'brand-' + d.slug);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.brands': written });
        res.json({ success: true, count: written, type: 'brands' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncOrders(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        const orders = await fetchWooPaginated('orders');
        const mapped = orders.map((o: any) => ({
            wpId: o.id, orderNumber: o.number || String(o.id),
            customerName: ((o.billing && o.billing.first_name) || '') + ' ' + ((o.billing && o.billing.last_name) || ''),
            customerEmail: o.billing ? o.billing.email || '' : '',
            customerPhone: o.billing ? o.billing.phone || '' : '',
            total: parseFloat(o.total) || 0, currency: o.currency || 'INR',
            paymentMethod: o.payment_method || 'cod', status: mapWooStatus(o.status),
            shippingAddress: o.shipping ? { name: (o.shipping.first_name || '') + ' ' + (o.shipping.last_name || ''), address1: o.shipping.address_1 || '', city: o.shipping.city || '', state: o.shipping.state || '', postcode: o.shipping.postcode || '', country: o.shipping.country || '' } : null,
            items: (o.line_items || []).map((i: any) => ({ name: i.name, productId: i.product_id, quantity: i.quantity, price: parseFloat(i.price || '0') })),
            createdAt: o.date_created || new Date().toISOString(),
            date: o.date_created || new Date().toISOString(),
            source: 'woocommerce',
        }));
        const written = await batchWrite('orders', mapped, (d) => 'wp-' + d.wpId);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.orders': written });
        res.json({ success: true, count: written, type: 'orders' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncUsers(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        const customers = await fetchWooPaginated('customers');
        const mapped = customers.map((c: any) => ({
            wpId: c.id, name: ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.username || 'Customer',
            email: c.email || '', phone: c.billing ? c.billing.phone || '' : '', avatar: c.avatar_url || '', role: 'customer',
            billingAddress: c.billing ? { name: (c.billing.first_name || '') + ' ' + (c.billing.last_name || ''), address1: c.billing.address_1 || '', city: c.billing.city || '', state: c.billing.state || '', postcode: c.billing.postcode || '', country: c.billing.country || '' } : null,
            createdAt: c.date_created || new Date().toISOString(), source: 'woocommerce',
        }));
        const written = await batchWrite('users', mapped, (d) => 'wp-' + d.wpId);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.users': written });
        res.json({ success: true, count: written, type: 'users' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncReviews(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing' });
        const reviews = await fetchWooPaginated('products/reviews');
        const mapped = reviews.map((r: any) => ({
            wpId: r.id, productId: r.product_id, productName: r.product_name || '',
            reviewer: r.reviewer || 'Anonymous', rating: r.rating || 0, review: r.review || '',
            verified: r.verified || false, createdAt: r.date_created || new Date().toISOString(), source: 'woocommerce',
        }));
        const written = await batchWrite('reviews', mapped, (d) => 'wp-' + d.wpId);
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), 'syncCounts.reviews': written });
        res.json({ success: true, count: written, type: 'reviews' });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function syncAll(req: Request, res: Response) {
    try {
        await updateSyncStatus({ syncStatus: 'syncing', lastError: null });
        const results: Record<string, number> = {};
        // Categories
        try {
            const cats = await fetchWooPaginated('products/categories');
            results.categories = await batchWrite('categories', cats.map((c: any) => ({ wpId: c.id, name: c.name, slug: c.slug, description: c.description || '', image: c.image ? c.image.src : '', parent: c.parent || 0, count: c.count || 0, source: 'woocommerce' })), (d) => 'wp-' + d.wpId);
        } catch (e: any) { logger.error('Category sync failed', { error: e }); }
        // Brands
        try {
            let brands: any[] = [];
            try { brands = await fetchWooPaginated('products/attributes'); const ba = brands.find((a: any) => a.name && a.name.toLowerCase() === 'brand'); if (ba) brands = await fetchWooPaginated('products/attributes/' + ba.id + '/terms'); } catch { try { brands = await fetchWooPaginated('brands'); } catch { } }
            if (!brands.length) {
                const prods = await fetchWooPaginated('products', { status: 'publish' });
                const bs = new Map<string, any>();
                for (const p of prods) { const ba = (p.attributes || []).find((a: any) => a.name && a.name.toLowerCase() === 'brand'); if (ba && ba.options) { for (const bn of ba.options) { if (!bs.has(bn)) bs.set(bn, { name: bn, slug: bn.toLowerCase().replace(/\s+/g, '-'), productCount: 0 }); const entry = bs.get(bn); if (entry) entry.productCount++; } } }
                brands = Array.from(bs.values());
            }
            results.brands = await batchWrite('brands', brands.map((b: any) => ({ wpId: b.id || null, name: b.name, slug: b.slug || b.name.toLowerCase().replace(/\s+/g, '-'), description: b.description || '', image: b.image ? (b.image.src || b.image) : '', productCount: b.count || b.productCount || 0, source: 'woocommerce' })), (d) => d.wpId ? 'wp-' + d.wpId : 'brand-' + d.slug);
        } catch (e: any) { logger.error('Brand sync failed', { error: e }); }
        // Products
        try {
            const prods = await fetchWooPaginated('products', { status: 'publish' });
            results.products = await batchWrite('products', prods.map((p: any) => ({ wpId: p.id, name: p.name, slug: p.slug, description: p.description || '', shortDescription: p.short_description || '', price: parseFloat(p.price) || 0, originalPrice: parseFloat(p.regular_price) || parseFloat(p.price) || 0, salePrice: p.sale_price ? parseFloat(p.sale_price) : null, sku: p.sku || '', stock: p.stock_quantity || (p.manage_stock ? 0 : 10), manageStock: p.manage_stock || false, stockStatus: p.stock_status || 'instock', image: (p.images && p.images[0]) ? p.images[0].src : '', images: (p.images || []).map((img: any) => img.src), category: (p.categories && p.categories[0]) ? p.categories[0].name : 'General', categoryId: (p.categories && p.categories[0]) ? p.categories[0].id : null, brand: (p.attributes || []).find((a: any) => a.name && a.name.toLowerCase() === 'brand') ? ((p.attributes.find((a: any) => a.name.toLowerCase() === 'brand').options || [])[0] || '') : '', categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })), attributes: (p.attributes || []).map((a: any) => ({ id: a.id, name: a.name, options: a.options })), variations: p.variations || [], weight: p.weight || '', dimensions: p.dimensions || {}, type: p.type || 'simple', featured: p.featured || false, rating: parseFloat(p.average_rating) || 0, reviews: p.rating_count || 0, status: p.status || 'publish', source: 'woocommerce' })), (d) => 'wp-' + d.wpId);
        } catch (e: any) { logger.error('Product sync failed', { error: e }); }
        // Users
        try {
            const custs = await fetchWooPaginated('customers');
            results.users = await batchWrite('users', custs.map((c: any) => ({ wpId: c.id, name: ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.username || 'Customer', email: c.email || '', phone: c.billing ? c.billing.phone || '' : '', avatar: c.avatar_url || '', role: 'customer', billingAddress: c.billing ? { name: (c.billing.first_name || '') + ' ' + (c.billing.last_name || ''), address1: c.billing.address_1 || '', city: c.billing.city || '', state: c.billing.state || '', postcode: c.billing.postcode || '', country: c.billing.country || '' } : null, createdAt: c.date_created || new Date().toISOString(), source: 'woocommerce' })), (d) => 'wp-' + d.wpId);
        } catch (e: any) { logger.error('User sync failed', { error: e }); }
        // Orders
        try {
            const ords = await fetchWooPaginated('orders');
            results.orders = await batchWrite('orders', ords.map((o: any) => ({ wpId: o.id, orderNumber: o.number || String(o.id), customerName: ((o.billing && o.billing.first_name) || '') + ' ' + ((o.billing && o.billing.last_name) || ''), customerEmail: o.billing ? o.billing.email || '' : '', total: parseFloat(o.total) || 0, currency: o.currency || 'INR', paymentMethod: o.payment_method || 'cod', status: mapWooStatus(o.status), items: (o.line_items || []).map((i: any) => ({ name: i.name, productId: i.product_id, quantity: i.quantity, price: parseFloat(i.price || '0') })), date: o.date_created || new Date().toISOString(), createdAt: o.date_created || new Date().toISOString(), source: 'woocommerce' })), (d) => 'wp-' + d.wpId);
        } catch (e: any) { logger.error('Order sync failed', { error: e }); }
        // Reviews
        try {
            const revs = await fetchWooPaginated('products/reviews');
            results.reviews = await batchWrite('reviews', revs.map((r: any) => ({ wpId: r.id, productId: r.product_id, productName: r.product_name || '', reviewer: r.reviewer || 'Anonymous', rating: r.rating || 0, review: r.review || '', verified: r.verified || false, createdAt: r.date_created || new Date().toISOString(), source: 'woocommerce' })), (d) => 'wp-' + d.wpId);
        } catch (e: any) { logger.error('Review sync failed', { error: e }); }
        await updateSyncStatus({ syncStatus: 'idle', lastSyncAt: new Date().toISOString(), syncCounts: { products: results.products || 0, categories: results.categories || 0, brands: results.brands || 0, orders: results.orders || 0, users: results.users || 0, reviews: results.reviews || 0 } });
        res.json({ success: true, results });
    } catch (error: any) {
        await updateSyncStatus({ syncStatus: 'error', lastError: error.message });
        res.status(500).json({ error: error.message });
    }
}

export async function getSyncStatus(req: Request, res: Response) {
    try {
        const doc = await db.collection('settings').doc('wordpress_sync').get();
        res.json(doc.exists ? doc.data() : { syncStatus: 'idle', lastSyncAt: null, lastError: null, syncCounts: { products: 0, categories: 0, brands: 0, orders: 0, users: 0, reviews: 0 } });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to get sync status' });
    }
}