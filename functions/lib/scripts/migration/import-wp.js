"use strict";
/**
 * WordPress to Firebase Migration Script
 * Fetches all WooCommerce data and imports to Firestore
 *
 * Usage:
 *   npx tsx backend/src/scripts/migration/import-wp.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const woocommerce_rest_api_1 = __importDefault(require("@woocommerce/woocommerce-rest-api"));
const firebase_1 = require("../../config/firebase");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const WP_URL = process.env.WP_URL || "";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || "";
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || "";
if (!WP_URL || !WP_CONSUMER_KEY || !WP_CONSUMER_SECRET) {
    console.error("❌ Missing WordPress credentials in .env");
    process.exit(1);
}
// @ts-ignore - package has no default export type issues
const api = new woocommerce_rest_api_1.default.default({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
    axiosConfig: { timeout: 60000 }
});
const BATCH_SIZE = 20;
const DELAY_MS = 500; // 500ms delay between batch requests to avoid overloading server
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
/** Utility: Fetch all pages from a WooCommerce endpoint */
async function fetchAll(endpoint, params = {}) {
    let page = 1;
    let results = [];
    let totalPages = 1;
    do {
        const { data, headers } = await api.get(endpoint, { ...params, per_page: BATCH_SIZE, page });
        results = results.concat(data);
        totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
        console.log(`  ↳ Page ${page}/${totalPages} (${results.length} records so far)`);
        page++;
        if (page <= totalPages)
            await sleep(DELAY_MS);
    } while (page <= totalPages);
    return results;
}
/** Utility: Write batch to Firestore */
async function batchWrite(collection, docs, idFn) {
    for (let i = 0; i < docs.length; i += 400) {
        const chunk = docs.slice(i, i + 400);
        const batch = firebase_1.db.batch();
        for (const doc of chunk) {
            const ref = idFn ? firebase_1.db.collection(collection).doc(idFn(doc)) : firebase_1.db.collection(collection).doc();
            batch.set(ref, doc, { merge: true });
        }
        await batch.commit();
    }
}
// ─────────────────────────────────────────────────
// 1. CATEGORIES
// ─────────────────────────────────────────────────
async function migrateCategories() {
    console.log("\n📦 Migrating Categories...");
    const wpCats = await fetchAll("products/categories", { hide_empty: false });
    const mapped = wpCats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image?.src || null,
        iconClass: null,
        wpId: c.id,
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    }));
    await batchWrite("categories", mapped, (d) => String(d.id));
    console.log(`  ✅ ${mapped.length} categories saved.`);
}
// ─────────────────────────────────────────────────
// 2. BRANDS (from WC Attribute or Tag taxonomy)
// ─────────────────────────────────────────────────
async function migrateBrands() {
    console.log("\n🏷️ Migrating Brands...");
    let brandTerms = [];
    try {
        // Try fetching from dedicated brands endpoint (common in YITH/Perfect Brands plugins)
        console.log("  ↳ Trying /products/brands endpoint...");
        brandTerms = await fetchAll("products/brands");
    }
    catch (e) {
        console.log("  ⚠️ /products/brands failed, falling back to attributes.");
    }
    // Fallback: Try 'pa_brand' attribute
    if (brandTerms.length === 0) {
        try {
            const { data: attributes } = await api.get("products/attributes");
            const brandAttr = attributes.find((a) => a.slug === "pa_brand" || a.slug === "brand" || a.name.toLowerCase() === "brand");
            if (brandAttr) {
                console.log(`  ↳ Found brand attribute: "${brandAttr.name}" (id: ${brandAttr.id})`);
                brandTerms = await fetchAll(`products/attributes/${brandAttr.id}/terms`);
            }
        }
        catch (e) {
            console.error("  ⚠️ Could not fetch attributes:", e);
        }
    }
    if (brandTerms.length === 0) {
        console.log("  No brands found via endpoint or attributes. Skipping.");
        return;
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
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    }));
    await batchWrite("brands", mapped, (d) => String(d.id));
    console.log(`  ✅ ${mapped.length} brands saved.`);
}
// ─────────────────────────────────────────────────
// 3. PRODUCTS (including variable products)
// ─────────────────────────────────────────────────
async function migrateProducts() {
    console.log("\n🦷 Migrating Products...");
    const wpProducts = await fetchAll("products", { status: "publish" });
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
            type: p.type, // simple, variable, grouped
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
                ? firebase_admin_1.default.firestore.Timestamp.fromDate(new Date(p.date_created))
                : firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
        };
        // Fetch variations for variable products
        if (p.type === "variable") {
            try {
                const rawVars = await fetchAll(`products/${p.id}/variations`);
                product.variations = rawVars.map((v) => ({
                    id: String(v.id),
                    price: parseFloat(v.price || "0"),
                    originalPrice: parseFloat(v.regular_price || "0"),
                    image: v.image?.src || "",
                    stock: v.stock_quantity ?? (v.in_stock ? 99 : 0),
                    attributes: Object.fromEntries(v.attributes?.map((a) => [a.name, a.option]) || []),
                    sku: v.sku || "",
                }));
                console.log(`    Fetched ${product.variations.length} variations for "${p.name}"`);
            }
            catch (e) {
                console.warn(`    ⚠️ Could not fetch variations for ${p.id}:`, e);
            }
        }
        mapped.push(product);
    }
    await batchWrite("products", mapped, (d) => String(d.id));
    console.log(`  ✅ ${mapped.length} products saved.`);
}
// ─────────────────────────────────────────────────
// 4. REVIEWS
// ─────────────────────────────────────────────────
async function migrateReviews() {
    console.log("\n⭐ Migrating Reviews...");
    const wpReviews = await fetchAll("products/reviews", { status: "approved" });
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
            ? firebase_admin_1.default.firestore.Timestamp.fromDate(new Date(r.date_created))
            : firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    }));
    await batchWrite("reviews", mapped, (d) => `wp-${d.wpId}`);
    console.log(`  ✅ ${mapped.length} reviews saved.`);
}
// ─────────────────────────────────────────────────
// 5. CUSTOMERS
// ─────────────────────────────────────────────────
async function migrateCustomers() {
    console.log("\n👥 Migrating Customers...");
    const wpCustomers = await fetchAll("customers");
    let created = 0;
    let skipped = 0;
    for (const c of wpCustomers) {
        if (!c.email) {
            skipped++;
            continue;
        }
        // Check if already exists in Firebase Auth
        let uid = null;
        try {
            const existing = await firebase_1.auth.getUserByEmail(c.email);
            uid = existing.uid;
            console.log(`    Existing user: ${c.email}`);
        }
        catch {
            // User doesn't exist — create
            try {
                const userRecord = await firebase_1.auth.createUser({
                    email: c.email,
                    displayName: `${c.first_name} ${c.last_name}`.trim(),
                    disabled: false,
                    // No password — user will use "Forgot Password" to set one
                });
                uid = userRecord.uid;
                created++;
            }
            catch (e) {
                console.warn(`    ⚠️ Could not create Auth user ${c.email}:`, e.message);
                skipped++;
                continue;
            }
        }
        // Create Firestore user profile
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
            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
        };
        await firebase_1.db.collection("users").doc(uid).set(profile, { merge: true });
        await sleep(100); // Gentle rate limiting for Auth API
    }
    console.log(`  ✅ ${created} customers created, ${skipped} skipped.`);
}
// ─────────────────────────────────────────────────
// 6. ORDERS
// ─────────────────────────────────────────────────
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
async function migrateOrders() {
    console.log("\n🛒 Migrating Orders...");
    const wpOrders = await fetchAll("orders");
    const mapped = wpOrders.map((o) => ({
        wpId: String(o.id),
        userId: o.customer_id ? String(o.customer_id) : null,
        customerEmail: o.billing?.email || "",
        customerName: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim(),
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
            ? firebase_admin_1.default.firestore.Timestamp.fromDate(new Date(o.date_created))
            : firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    }));
    await batchWrite("orders", mapped, (d) => `wp-${d.wpId}`);
    console.log(`  ✅ ${mapped.length} orders saved.`);
}
// ─────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────
async function runMigration() {
    console.log("═══════════════════════════════════════════");
    console.log("🚀  Alpha Dentkart WordPress Migration");
    console.log(`    Source: ${WP_URL}`);
    console.log("═══════════════════════════════════════════");
    const start = Date.now();
    await migrateCategories();
    await migrateBrands();
    await migrateProducts();
    await migrateReviews();
    await migrateCustomers();
    await migrateOrders();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log("\n═══════════════════════════════════════════");
    console.log(`✅  Migration complete in ${elapsed}s`);
    console.log("═══════════════════════════════════════════");
    process.exit(0);
}
runMigration().catch(e => {
    console.error("❌ Fatal Error:", e);
    process.exit(1);
});
//# sourceMappingURL=import-wp.js.map