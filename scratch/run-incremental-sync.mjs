import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const WP_URL = "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || 'ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031';
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || 'cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1';
const LAST_SYNC_DATE = "2026-02-19T00:00:00";

// Initialize Firebase Admin
const serviceAccountPath = path.resolve('firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
const auth = admin.auth();

const WC = WooCommerceRestApi.default || WooCommerceRestApi;
const api = new WC({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: { timeout: 60000 }
});

const BATCH_SIZE = 100;
const DELAY_MS = 200;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAll(endpoint, params = {}) {
    let page = 1;
    let results = [];
    let totalPages = 1;

    try {
        do {
            const response = await api.get(endpoint, { ...params, per_page: BATCH_SIZE, page });
            const data = response.data;
            const headers = response.headers;
            
            if (data && Array.isArray(data)) {
                results = results.concat(data);
            }
            totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
            console.log(`  [WooCommerce] Fetched page ${page}/${totalPages} for ${endpoint} (${results.length} records)`);
            page++;
            if (page <= totalPages) await sleep(DELAY_MS);
        } while (page <= totalPages);
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }

    return results;
}

async function batchWrite(collection, docs, idFn) {
    if (docs.length === 0) return 0;
    
    let written = 0;
    for (let i = 0; i < docs.length; i += 450) {
        const chunk = docs.slice(i, i + 450);
        const batch = db.batch();
        for (const doc of chunk) {
            const ref = idFn ? db.collection(collection).doc(idFn(doc)) : db.collection(collection).doc();
            batch.set(ref, doc, { merge: true });
            written++;
        }
        await batch.commit();
        console.log(`  [Firestore] Committed batch of ${chunk.length} to ${collection}`);
        await sleep(100);
    }
    return written;
}

async function syncCategories() {
    console.log("\n📦 Syncing Categories (Full)...");
    const wpCats = await fetchAll("products/categories", { hide_empty: false });
    const mapped = wpCats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image?.src || null,
        iconClass: null,
        wpId: c.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));
    const written = await batchWrite("categories", mapped, (d) => String(d.id));
    console.log(`  ✅ ${written} categories synced.`);
    return written;
}

async function syncBrands() {
    console.log("\n🏷️ Syncing Brands...");
    let brandTerms = [];
    try {
        brandTerms = await fetchAll("products/brands");
    } catch (e) {
        console.log("  ⚠️ /products/brands failed, trying pa_brand attribute...");
        try {
            const { data: attributes } = await api.get("products/attributes");
            const brandAttr = attributes.find((a) =>
                a.slug === "pa_brand" || a.slug === "brand" || a.name.toLowerCase() === "brand"
            );
            if (brandAttr) {
                brandTerms = await fetchAll(`products/attributes/${brandAttr.id}/terms`);
            }
        } catch (err) {
            console.log("  ⚠️ Could not fetch brands via attributes");
        }
    }

    if (brandTerms.length === 0) {
        console.log("  ⏭️ No brands to sync.");
        return 0;
    }

    const mapped = brandTerms.map((t, idx) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.image?.src || "",
        description: t.description || "",
        productCount: t.count || 0,
        isFeatured: false,
        featuredOrder: idx,
        wpId: t.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));

    const written = await batchWrite("brands", mapped, (d) => String(d.id));
    console.log(`  ✅ ${written} brands synced.`);
    return written;
}

async function syncProducts() {
    console.log(`\n🦷 Syncing Products (updated after ${LAST_SYNC_DATE})...`);
    const wpProducts = await fetchAll("products", { 
        status: "publish",
        updated_after: LAST_SYNC_DATE
    });

    if (wpProducts.length === 0) {
        console.log("  ⏭️ No new products to sync.");
        return 0;
    }

    console.log(`  Found ${wpProducts.length} updated products`);
    const mapped = [];

    for (const p of wpProducts) {
        const product = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: parseFloat(p.price || p.regular_price || "0"),
            originalPrice: parseFloat(p.regular_price || "0"),
            salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
            description: p.description || "",
            shortDescription: p.short_description || "",
            image: p.images?.[0]?.src || "",
            images: p.images?.map((img) => img.src) || [],
            category: p.categories?.[0]?.name || "",
            categoryId: p.categories?.[0]?.id || null,
            brand: p.brands?.[0]?.name ||
                p.attributes?.find((a) => a.slug === "pa_brand" || a.name.toLowerCase() === "brand")?.options?.[0] || "",
            brandId: p.brands?.[0]?.id || null,
            rating: parseFloat(p.average_rating || "0"),
            reviews: p.rating_count || 0,
            stock: p.stock_quantity ?? (p.in_stock ? 99 : 0),
            sku: p.sku || "",
            type: p.type,
            attributes: p.attributes?.map((a) => ({
                name: a.name,
                options: a.options || [],
            })) || [],
            specs: {
                SKU: p.sku || "",
                Weight: p.weight ? `${p.weight} kg` : "",
                Dimensions: p.dimensions
                    ? `${p.dimensions.length}×${p.dimensions.width}×${p.dimensions.height} cm`
                    : "",
            },
            seoTitle: p.yoast_head_json?.title || p.name,
            seoDescription: p.yoast_head_json?.description || p.short_description || "",
            variations: [],
            wpId: p.id,
            createdAt: p.date_created
                ? admin.firestore.Timestamp.fromDate(new Date(p.date_created))
                : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (p.type === "variable" && process.argv.includes('--with-variations')) {
            try {
                const rawVars = await fetchAll(`products/${p.id}/variations`);
                product.variations = rawVars.map((v) => ({
                    id: String(v.id),
                    price: parseFloat(v.price || "0"),
                    originalPrice: parseFloat(v.regular_price || "0"),
                    image: v.image?.src || "",
                    stock: v.stock_quantity ?? (v.in_stock ? 99 : 0),
                    attributes: Object.fromEntries(
                        v.attributes?.map((a) => [a.name, a.option]) || []
                    ),
                    sku: v.sku || "",
                }));
            } catch (e) {
                console.warn(`    ⚠️ Could not fetch variations for ${p.id}`);
            }
        }

        mapped.push(product);
    }

    const written = await batchWrite("products", mapped, (d) => String(d.id));
    console.log(`  ✅ ${written} products synced.`);
    return written;
}

async function syncReviews() {
    console.log(`\n⭐ Syncing Reviews (after ${LAST_SYNC_DATE})...`);
    const wpReviews = await fetchAll("products/reviews", { 
        status: "approved",
        after: LAST_SYNC_DATE
    });

    if (wpReviews.length === 0) {
        console.log("  ⏭️ No new reviews to sync.");
        return 0;
    }

    const mapped = wpReviews.map((r) => ({
        wpId: r.id,
        productId: r.product_id,
        userId: r.reviewer_email,
        rating: r.rating,
        title: "",
        content: r.review,
        reviewer: r.reviewer,
        reviewerEmail: r.reviewer_email,
        isVerified: r.verified,
        isApproved: r.status === "approved",
        helpful: 0,
        createdAt: r.date_created
            ? admin.firestore.Timestamp.fromDate(new Date(r.date_created))
            : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));

    const written = await batchWrite("reviews", mapped, (d) => `wp-${d.wpId}`);
    console.log(`  ✅ ${written} reviews synced.`);
    return written;
}

async function syncCustomers() {
    console.log(`\n👥 Syncing Customers (registered after ${LAST_SYNC_DATE})...`);
    const wpCustomers = await fetchAll("customers", {
        updated_after: LAST_SYNC_DATE
    });

    if (wpCustomers.length === 0) {
        console.log("  ⏭️ No new customers to sync.");
        return 0;
    }

    console.log(`  Found ${wpCustomers.length} updated customers`);
    let created = 0;
    let skipped = 0;

    for (const c of wpCustomers) {
        if (!c.email) { skipped++; continue; }

        let uid = null;
        try {
            const existing = await auth.getUserByEmail(c.email);
            uid = existing.uid;
            console.log(`    Existing user: ${c.email}`);
        } catch {
            try {
                const userRecord = await auth.createUser({
                    email: c.email,
                    displayName: `${c.first_name} ${c.last_name}`.trim(),
                    disabled: false,
                });
                uid = userRecord.uid;
                created++;
                console.log(`    Created new Auth user: ${c.email}`);
            } catch (e) {
                console.warn(`    ⚠️ Could not create user ${c.email}:`, e.message);
                skipped++;
                continue;
            }
        }

        if (!uid) { skipped++; continue; }

        const billing = c.billing || {};
        const profile = {
            uid,
            name: `${c.first_name} ${c.last_name}`.trim(),
            email: c.email,
            phone: billing.phone || "",
            avatar: c.avatar_url || "",
            userType: "regular",
            registrationDate: c.date_created
                ? new Date(c.date_created).toISOString()
                : new Date().toISOString(),
            isVerified: false,
            verificationStatus: "pending",
            addresses: billing.address_1 ? [{
                id: 1,
                type: "Home",
                name: `${billing.first_name} ${billing.last_name}`.trim(),
                street: `${billing.address_1} ${billing.address_2 || ""}`.trim(),
                city: billing.city || "",
                state: billing.state || "",
                zip: billing.postcode || "",
                phone: billing.phone || "",
                isDefault: true,
            }] : [],
            orders: [],
            cart: [],
            wishlist: [],
            wpId: c.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("users").doc(uid).set(profile, { merge: true });
        await sleep(50);
    }

    console.log(`  ✅ ${created} customers created, ${skipped} skipped.`);
    return created;
}

async function syncOrders() {
    console.log(`\n🛒 Syncing Orders (placed after ${LAST_SYNC_DATE})...`);
    
    const WC_STATUS_MAP = {
        "pending": "Processing",
        "processing": "Processing",
        "on-hold": "Processing",
        "completed": "Delivered",
        "cancelled": "Cancelled",
        "refunded": "Cancelled",
        "failed": "Cancelled",
        "shipped": "Shipped",
    };

    const wpOrders = await fetchAll("orders", {
        after: LAST_SYNC_DATE
    });

    if (wpOrders.length === 0) {
        console.log("  ⏭️ No new orders to sync.");
        return 0;
    }

    console.log(`  Found ${wpOrders.length} orders to sync`);

    const mapped = wpOrders.map((o) => ({
        wpId: String(o.id),
        userId: o.customer_id ? String(o.customer_id) : null,
        customerEmail: o.billing?.email || "",
        customerName: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim(),
        // IMPORTANT: We explicitly include both `date` and `createdAt` so that old/new codebases render the date perfectly!
        date: o.date_created ? new Date(o.date_created).toISOString() : new Date().toISOString(),
        status: WC_STATUS_MAP[o.status] || "Processing",
        total: parseFloat(o.total || "0"),
        subtotal: parseFloat(o.subtotal || "0"),
        shippingTotal: parseFloat(o.shipping_total || "0"),
        discountTotal: parseFloat(o.discount_total || "0"),
        items: o.line_items?.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price || "0"),
            productId: item.product_id,
            sku: item.sku || "",
            image: item.image?.src || "",
        })) || [],
        shippingAddress: {
            id: 1,
            type: "Home",
            name: `${o.shipping?.first_name || ""} ${o.shipping?.last_name || ""}`.trim(),
            street: `${o.shipping?.address_1 || ""} ${o.shipping?.address_2 || ""}`.trim(),
            city: o.shipping?.city || "",
            state: o.shipping?.state || "",
            zip: o.shipping?.postcode || "",
            phone: o.billing?.phone || "",
            isDefault: true,
        },
        paymentMethod: o.payment_method || "cod",
        paymentStatus: o.status === "completed" ? "paid" : "pending",
        notes: o.customer_note || "",
        couponCodes: o.coupon_lines?.map((c) => c.code) || [],
        createdAt: o.date_created
            ? admin.firestore.Timestamp.fromDate(new Date(o.date_created))
            : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'wordpress_sync'
    }));

    // Save with the 'wp-' prefix to perfectly match and overwrite the old WooCommerce IDs
    const written = await batchWrite("orders", mapped, (d) => `wp-${d.wpId}`);
    console.log(`  ✅ ${written} orders synced.`);
    return written;
}

async function run() {
    console.log("=========================================");
    console.log("🔄 WordPress to Firestore Incremental Sync");
    console.log(`   Source: ${WP_URL}`);
    console.log(`   Target: Firebase Firestore`);
    console.log("=========================================");
    
    const start = Date.now();
    const skipProducts = !process.argv.includes('--with-products');
    const skipCustomers = !process.argv.includes('--with-customers');
    
    // Run sync processes
    const categories = await syncCategories();
    const brands = await syncBrands();
    const products = skipProducts ? 0 : await syncProducts();
    const reviews = await syncReviews();
    const customers = skipCustomers ? 0 : await syncCustomers();
    const orders = await syncOrders();
    
    // Save last sync time in settings
    try {
        await db.collection('settings').doc('sync_status').set({
            lastProductSync: admin.firestore.Timestamp.fromDate(new Date()),
            lastOrderSync: admin.firestore.Timestamp.fromDate(new Date()),
            lastUserSync: admin.firestore.Timestamp.fromDate(new Date()),
            lastProductSync_last_success: admin.firestore.Timestamp.fromDate(new Date()),
            lastOrderSync_last_success: admin.firestore.Timestamp.fromDate(new Date()),
            lastUserSync_last_success: admin.firestore.Timestamp.fromDate(new Date())
        }, { merge: true });
        console.log("\n📊 Updated Firestore settings/sync_status successfully.");
    } catch (e) {
        console.error("Failed to update last sync time settings:", e.message);
    }
    
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log("\n=========================================");
    console.log("📊 Sync completed successfully in " + duration + "s!");
    console.log(`   Categories: ${categories}`);
    console.log(`   Brands:     ${brands}`);
    console.log(`   Products:   ${products}`);
    console.log(`   Reviews:    ${reviews}`);
    console.log(`   Customers:  ${customers}`);
    console.log(`   Orders:     ${orders}`);
    console.log("=========================================");
}

run().catch(e => {
    console.error("Fatal Sync Error:", e);
});
