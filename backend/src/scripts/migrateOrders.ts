import { db, admin } from '../config/firebase';
import fs from 'fs';
import path from 'path';

// Type definition for WordPress Order Export
interface WPOrder {
    id: number;
    status: string;
    date_created: string;
    total: string;
    customer_id: number;
    billing: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        address_1: string;
        city: string;
        state: string;
        postcode: string;
    };
    line_items: Array<{
        product_id: number;
        name: string;
        quantity: number;
        price: number; // Subtotal
        total: number;
    }>;
    payment_method: string;
    transaction_id: string;
}

async function migrateOrders() {
    console.log('🚀 Starting Order Migration...');

    const dataPath = path.join(process.cwd(), 'migration', 'wordpress_orders.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found at: ${dataPath}`);
        process.exit(1);
    }

    const orders: WPOrder[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📦 Found ${orders.length} orders to migrate.`);

    // Pre-fetch Users map (WP_ID -> UID) for linking
    // Note: In a huge dataset, strict mapping might be hard. We query by email.

    let processed = 0;

    for (const wpOrder of orders) {
        try {
            // Find User ID (UID)
            let userId = 'guest'; // Default
            if (wpOrder.billing.email) {
                const userSnapshot = await db.collection('users').where('email', '==', wpOrder.billing.email).limit(1).get();
                if (!userSnapshot.empty) {
                    userId = userSnapshot.docs[0].id;
                }
            }

            // Map Status
            const statusMap: Record<string, string> = {
                'pending': 'Pending',
                'processing': 'Processing',
                'completed': 'Delivered',
                'cancelled': 'Cancelled',
                'refunded': 'Refunded',
                'failed': 'Failed'
            };

            const firestoreOrder = {
                wpId: wpOrder.id,
                userId: userId,
                customerName: `${wpOrder.billing.first_name} ${wpOrder.billing.last_name}`.trim(),
                total: parseFloat(wpOrder.total),
                status: statusMap[wpOrder.status] || 'Processing',
                paymentMethod: wpOrder.payment_method,
                transactionId: wpOrder.transaction_id || `WP-ORD-${wpOrder.id}`,
                paymentStatus: wpOrder.status === 'completed' || wpOrder.status === 'processing' ? 'paid' : 'pending',
                items: wpOrder.line_items.map(item => ({
                    productId: String(item.product_id), // We use WP ID as Doc ID for products
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                shippingAddress: {
                    name: `${wpOrder.billing.first_name} ${wpOrder.billing.last_name}`,
                    street: wpOrder.billing.address_1,
                    city: wpOrder.billing.city,
                    state: wpOrder.billing.state,
                    zip: wpOrder.billing.postcode,
                    phone: wpOrder.billing.phone
                },
                createdAt: new Date(wpOrder.date_created).toISOString(),
                updatedAt: new Date(wpOrder.date_created).toISOString(), // Keep original date
                source: 'wordpress_migration'
            };

            // Use WP ID as Doc ID for easy reference or auto-id?
            // Let's use WP ID prefixed? Or just WP ID if verify unique?
            // Products used ID. Orders often used ID.
            // Let's use Auto-ID but store wpId field, to avoid collation issues.
            await db.collection('orders').add(firestoreOrder);

            process.stdout.write('.');
            processed++;

        } catch (err) {
            console.error(`\n❌ Failed order ${wpOrder.id}:`, err);
        }
    }

    console.log(`\n🎉 Order Migration Complete! Processed: ${processed}`);
}

migrateOrders().catch(console.error);
