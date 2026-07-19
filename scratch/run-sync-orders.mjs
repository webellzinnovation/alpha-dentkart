import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize Firebase Admin
const serviceAccountPath = path.resolve('firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('firebase-service-account.json not found!');
    process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function getWooClient() {
    let url = "https://alphadentkart.com";
    let consumerKey = "";
    let consumerSecret = "";

    const doc = await db.collection('settings').doc('wordpress_sync').get();
    if (doc.exists) {
        const data = doc.data();
        url = (data.apiUrl || data.siteUrl || url).replace(/\/$/, '');
        consumerKey = data.consumerKey;
        consumerSecret = data.consumerSecret;
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

const mapStatus = (wooStatus) => {
    switch (wooStatus) {
        case 'processing':
            return 'Processing';
        case 'completed':
            return 'Delivered';
        case 'cancelled':
        case 'failed':
        case 'refunded':
            return 'Cancelled';
        case 'on-hold':
        case 'pending':
        default:
            return 'Processing';
    }
};

async function syncOrders() {
    console.log("📋 Fetching orders from WooCommerce...");
    const api = await getWooClient();
    
    // Fetch only the latest 3 orders
    const { data: orders } = await api.get("orders", { per_page: 3 });
    console.log(`Found ${orders.length} orders in WooCommerce`);

    for (const order of orders) {
        const mappedStatus = mapStatus(order.status);
        console.log(`WooCommerce Order #${order.id}:`);
        console.log(`  Original Status: "${order.status}"`);
        console.log(`  Mapped Status: "${mappedStatus}"`);
        console.log(`  Customer: ${order.billing.first_name} ${order.billing.last_name}`);
        console.log(`  Total: ₹${order.total}`);
    }
}

syncOrders().catch(console.error);
