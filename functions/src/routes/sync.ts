import { Router, Request, Response } from 'express';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { db } from '../config/firebase';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const WP_URL = (process.env.WP_URL || "https://alphadentkart.com").replace(/\/$/, '');
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || "ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031";
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || "cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1";

const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;
const api = new (WC as any)({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
    axiosConfig: { timeout: 60000 }
});

const BATCH_SIZE = 100;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAll(endpoint: string, params: Record<string, any> = {}): Promise<any[]> {
    let page = 1;
    let results: any[] = [];
    let totalPages = 1;

    do {
        const { data, headers } = await api.get(endpoint, { ...params, per_page: BATCH_SIZE, page });
        console.log(`Page ${page}: got ${data?.length || 0} items, total pages: ${headers?.["x-wp-totalpages"]}`);
        results = results.concat(data);
        totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
        page++;
        await sleep(100);
    } while (page <= totalPages);

    console.log(`Total fetched: ${results.length} items`);
    return results;
}

async function syncProducts(): Promise<number> {
    console.log("📦 Fetching products from WooCommerce...");
    const products = await fetchAll("/products", { status: "publish" });
    console.log(`Found ${products.length} products in WooCommerce`);

    let synced = 0;
    function getOriginalImageUrl(url: string): string {
        if (!url) return '';
        // Remove WordPress thumbnail size suffix (-150x150, -300x300, etc.)
        return url.replace(/-(\d+)x(\d+)\.(\w+)$/, '.$3');
    }

    const batch = db.batch();

    for (const product of products) {
        // Get original/full-size images instead of thumbnails
        const imageUrls = product.images?.map((img: any) => getOriginalImageUrl(img.src)) || [];
        
        const productData = {
            wpId: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.short_description,
            price: parseFloat(product.price) || 0,
            salePrice: parseFloat(product.sale_price) || parseFloat(product.price) || 0,
            originalPrice: parseFloat(product.regular_price) || parseFloat(product.price) || 0,
            stock: product.stock_quantity || 0,
            sku: product.sku || '',
            image: imageUrls[0] || '',
            images: imageUrls,
            category: product.categories?.[0]?.name || 'Dental',
            brand: product.tags?.[0]?.name || null,
            type: product.type,
            status: product.status,
            createdAt: new Date(product.date_created),
            updatedAt: new Date(product.date_modified),
            reviews: product.rating_count || 0,
            rating: product.average_rating || 0,
            specs: {},
            features: [],
            attributes: [],
            variations: [],
            source: 'wordpress_sync'
        };

        const productRef = db.collection('products').doc(String(product.id));
        batch.set(productRef, productData, { merge: true });
        synced++;

        if (synced % 50 === 0) {
            await batch.commit();
            console.log(`Synced ${synced}/${products.length} products`);
        }
    }

    await batch.commit();
    console.log(`✅ Synced ${synced} products`);
    return synced;
}

async function syncOrders(): Promise<number> {
    console.log("📋 Fetching orders from WooCommerce...");
    const orders = await fetchAll("/orders", { per_page: 100 });
    console.log(`Found ${orders.length} orders`);

    let synced = 0;
    const batch = db.batch();

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
            source: 'wordpress_sync'
        };

        const orderRef = db.collection('orders').doc(String(order.id));
        batch.set(orderRef, orderData, { merge: true });
        synced++;

        if (synced % 50 === 0) {
            await batch.commit();
            console.log(`Synced ${synced}/${orders.length} orders`);
        }
    }

    await batch.commit();
    console.log(`✅ Synced ${synced} orders`);
    return synced;
}

async function syncUsers(): Promise<number> {
    console.log("👥 Fetching customers from WooCommerce...");
    const customers = await fetchAll("/customers");
    console.log(`Found ${customers.length} customers`);

    let synced = 0;
    const batch = db.batch();

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
            source: 'wordpress_sync'
        };

        const userRef = db.collection('users').doc(String(customer.id));
        batch.set(userRef, userData, { merge: true });
        synced++;

        if (synced % 50 === 0) {
            await batch.commit();
            console.log(`Synced ${synced}/${customers.length} users`);
        }
    }

    await batch.commit();
    console.log(`✅ Synced ${synced} users`);
    return synced;
}

async function syncCategories(): Promise<number> {
    console.log("📂 Fetching categories from WooCommerce...");
    const categories = await fetchAll("/products/categories", { per_page: 100 });
    console.log(`Found ${categories.length} categories`);

    let synced = 0;
    const batch = db.batch();

    for (const cat of categories) {
        const categoryData = {
            wpId: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image?.src || '',
            parent: cat.parent || 0,
            count: cat.count || 0,
            source: 'wordpress_sync'
        };

        const catRef = db.collection('categories').doc(String(cat.id));
        batch.set(catRef, categoryData, { merge: true });
        synced++;
    }

    await batch.commit();
    console.log(`✅ Synced ${synced} categories`);
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
    console.log("🏷️ Fetching tags (brands) from WooCommerce...");
    const tags = await fetchAll("/products/tags", { per_page: 100 });
    console.log(`Found ${tags.length} tags`);

    let synced = 0;
    const batch = db.batch();

    for (const tag of tags) {
        const brandData = {
            wpId: tag.id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description || '',
            source: 'wordpress_sync'
        };

        const brandRef = db.collection('brands').doc(String(tag.id));
        batch.set(brandRef, brandData, { merge: true });
        synced++;
    }

    await batch.commit();
    console.log(`✅ Synced ${synced} brands`);
    return synced;
}

router.post('/products', async (req: Request, res: Response) => {
    try {
        console.log("Starting product sync...");
        const synced = await syncProducts();
        res.json({ success: true, synced, message: `Synced ${synced} products from WordPress` });
    } catch (error: any) {
        console.error('Product sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/orders', async (req: Request, res: Response) => {
    try {
        console.log("Starting order sync...");
        const synced = await syncOrders();
        res.json({ success: true, synced, message: `Synced ${synced} orders from WordPress` });
    } catch (error: any) {
        console.error('Order sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/users', async (req: Request, res: Response) => {
    try {
        console.log("Starting user sync...");
        const synced = await syncUsers();
        res.json({ success: true, synced, message: `Synced ${synced} users from WordPress` });
    } catch (error: any) {
        console.error('User sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/categories', async (req: Request, res: Response) => {
    try {
        console.log("Starting category sync...");
        const synced = await syncCategories();
        res.json({ success: true, synced, message: `Synced ${synced} categories from WordPress` });
    } catch (error: any) {
        console.error('Category sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/brands', async (req: Request, res: Response) => {
    try {
        console.log("Starting brand sync...");
        const synced = await syncBrands();
        res.json({ success: true, synced, message: `Synced ${synced} brands from WordPress` });
    } catch (error: any) {
        console.error('Brand sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/full', async (req: Request, res: Response) => {
    try {
        console.log("Starting full sync...");
        const categoriesSynced = await syncCategories();
        await sleep(500);
        const brandsSynced = await syncBrands();
        await sleep(500);
        const productsSynced = await syncProducts();
        await sleep(500);
        const ordersSynced = await syncOrders();
        await sleep(500);
        const usersSynced = await syncUsers();

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
        console.error('Full sync error:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

export default router;