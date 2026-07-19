import admin from 'firebase-admin';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Initialize Firebase Admin (uses local environment authentication, e.g. application default credentials or active firebase project)
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'alphadentkart-001'
    });
}
const db = admin.firestore();

async function run() {
    console.log("Fetching WooCommerce credentials from Firestore...");
    let doc = await db.collection('settings').doc('wordpress_credentials').get();
    let url = "https://alphadentkart.com";
    let consumerKey = "";
    let consumerSecret = "";
    if (doc.exists) {
        const data = doc.data();
        url = data.siteUrl || url;
        consumerKey = data.consumerKey;
        consumerSecret = data.consumerSecret;
    } else {
        doc = await db.collection('settings').doc('wordpress_sync').get();
        if (doc.exists) {
            const data = doc.data();
            url = data.apiUrl || data.siteUrl || url;
            consumerKey = data.consumerKey;
            consumerSecret = data.consumerSecret;
        }
    }

    if (!consumerKey || !consumerSecret) {
        console.error("❌ Error: WooCommerce API credentials not found in Firestore settings.");
        process.exit(1);
    }

    const WC = WooCommerceRestApi.default || WooCommerceRestApi;
    const api = new WC({
        url: url.replace(/\/$/, ''),
        consumerKey,
        consumerSecret,
        version: 'wc/v3',
        queryStringAuth: true
    });

    console.log(`Connecting to ${url}...`);
    console.log("Fetching orders from WooCommerce (in pages of 50)...");
    
    let page = 1;
    let totalPages = 1;
    let allOrders = [];

    do {
        console.log(`Fetching page ${page}...`);
        try {
            const response = await api.get('orders', {
                per_page: 50,
                page: page
            });
            
            if (response.data && Array.isArray(response.data)) {
                allOrders = allOrders.concat(response.data);
            }
            
            const tp = response.headers['x-wp-totalpages'];
            totalPages = tp ? parseInt(tp, 10) : 1;
            page++;
            // Pause briefly to avoid hammering the server
            await new Promise(r => setTimeout(r, 100));
        } catch (err) {
            console.error(`Error on page ${page}:`, err.message);
            break;
        }
    } while (page <= totalPages);

    console.log(`\nFetched ${allOrders.length} orders. Updating in Firestore...`);
    
    let batch = db.batch();
    let count = 0;
    
    for (const order of allOrders) {
        const customer = order.billing;
        const orderData = {
            wpId: order.id,
            orderNumber: order.number,
            customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Guest',
            customerEmail: customer.email || '',
            customerPhone: customer.phone || '',
            shippingAddress: {
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                address1: customer.address_1 || '',
                address2: customer.address_2 || '',
                city: customer.city || '',
                state: customer.state || '',
                postcode: customer.postcode || '',
                country: customer.country || ''
            },
            billingAddress: {
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                address1: customer.address_1 || '',
                address2: customer.address_2 || '',
                city: customer.city || '',
                state: customer.state || '',
                postcode: customer.postcode || '',
                country: customer.country || ''
            },
            items: (order.line_items || []).map((item) => ({
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price) || 0,
                total: parseFloat(item.total) || 0
            })),
            subtotal: parseFloat(order.subtotal) || 0,
            shipping: parseFloat(order.shipping_total) || 0,
            tax: parseFloat(order.total_tax) || 0,
            total: parseFloat(order.total) || 0,
            status: order.status === 'processing' ? 'Processing' :
                    order.status === 'completed' ? 'Delivered' :
                    order.status === 'cancelled' || order.status === 'failed' || order.status === 'refunded' ? 'Cancelled' :
                    order.status === 'shipped' ? 'Shipped' : 'Processing',
            paymentMethod: order.payment_method_title || '',
            paymentStatus: order.payment_status === 'paid' ? 'paid' : 'pending',
            date: order.date_created || new Date().toISOString(),
            createdAt: order.date_created ? new Date(order.date_created) : new Date(),
            updatedAt: order.date_modified ? new Date(order.date_modified) : new Date(),
            lastSync: new Date(),
            source: 'wordpress_sync'
        };

        const orderRef = db.collection('orders').doc(String(order.id));
        batch.set(orderRef, orderData, { merge: true });
        count++;

        if (count % 400 === 0) {
            await batch.commit();
            batch = db.batch();
            console.log(`Updated ${count} orders...`);
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }
    
    console.log(`\n🎉 Success! Synchronized and updated ${count} orders in Firestore.`);
    process.exit(0);
}

run().catch(err => {
    console.error("Fatal error running sync script:", err);
    process.exit(1);
});
