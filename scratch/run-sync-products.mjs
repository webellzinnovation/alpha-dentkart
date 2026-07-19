import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize Firebase Admin
const serviceAccountPath = path.resolve('firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('firebase-service-account.json not found in workspace!');
    process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// Fetch credentials from wordpress_sync
async function getWooClient() {
    let url = "https://alphadentkart.com";
    let consumerKey = 'ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031';
    let consumerSecret = 'cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1';

    try {
        const doc = await db.collection('settings').doc('wordpress_sync').get();
        if (doc.exists) {
            const data = doc.data();
            if (data?.siteUrl) url = data.siteUrl.replace(/\/$/, '');
            if (data?.consumerKey) consumerKey = data.consumerKey;
            if (data?.consumerSecret) consumerSecret = data.consumerSecret;
        }
    } catch (e) {
        console.error('Could not read wordpress_sync from Firestore:', e);
    }

    const WC = WooCommerceRestApi.default || WooCommerceRestApi;
    return new WC({
        url,
        consumerKey,
        consumerSecret,
        version: "wc/v3",
        queryStringAuth: true,
        axiosConfig: { timeout: 60000 }
    });
}

const BATCH_SIZE = 100;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAll(api, endpoint, params = {}) {
    let page = 1;
    let results = [];
    let totalPages = 1;

    try {
        do {
            console.log(`Fetching ${endpoint} page ${page}...`);
            const { data, headers } = await api.get(endpoint, { ...params, per_page: BATCH_SIZE, page });
            if (data && Array.isArray(data)) {
                results = results.concat(data);
            }
            totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
            page++;
            if (page <= totalPages) await sleep(100);
        } while (page <= totalPages);
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error?.response?.data || error?.message);
        throw error;
    }

    return results;
}

async function syncProducts(api, forceFull = false) {
    console.log("📦 Fetching products from WooCommerce...");
    
    const params = { status: "any" };
    // Fetch only a few products for testing (e.g. latest modified or specifically product 39201)
    // Actually, WooCommerce allows fetching specific product IDs! Let's do that to verify the exact mapping and writing!
    params.include = "39201,39188,39164";

    const products = await fetchAll(api, "products", params);
    console.log(`Found ${products.length} products to sync`);

    if (products.length === 0) return 0;

    let synced = 0;
    const getOriginalImageUrl = (url) => {
        if (!url) return '';
        return url.replace(/-(\d+)x(\d+)\.(\w+)$/, '.$3');
    };

    const processBatch = async (items) => {
        const batch = db.batch();
        
        for (const product of items) {
            const imageUrls = product.images?.map((img) => getOriginalImageUrl(img.src)) || [];
            
            const brandName = product.brands?.[0]?.name || 
                            product.attributes?.find((a) => a.slug === 'pa_brand' || a.name.toLowerCase() === 'brand')?.options?.[0] ||
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
                variations: [],
                source: 'wordpress_sync'
            };

            const productRef = db.collection('products').doc(String(product.id));
            batch.set(productRef, productData, { merge: true });
            synced++;
        }
        
        await batch.commit();
        console.log(`Committed batch of ${items.length} products`);
    };

    await processBatch(products);
    return synced;
}

async function run() {
    try {
        const api = await getWooClient();
        const syncedCount = await syncProducts(api, false);
        console.log(`Successfully synced ${syncedCount} products`);

        console.log('\nQuerying product 39201 in Firestore after sync:');
        const doc = await db.collection('products').doc('39201').get();
        if (doc.exists) {
            const data = doc.data();
            console.log(`Product ID: ${doc.id}`);
            console.log(`  Name: ${data.name}`);
            console.log(`  UpdatedAt in DB: ${data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt}`);
            console.log(`  lastSync: ${data.lastSync?.toDate ? data.lastSync.toDate().toISOString() : data.lastSync}`);
        }
    } catch (err) {
        console.error('Error during test sync:', err);
    }
}

run();
