/**
 * Migration: Backfill customerEmail field to existing orders
 * 
 * This script extracts email from WordPress orders JSON and updates Firestore orders
 */

import { db } from '../config/firebase';
import fs from 'fs';
import path from 'path';

interface WPOrder {
    id: number;
    billing: {
        email: string;
    };
}

async function backfillCustomerEmails() {
    console.log('🚀 Starting customerEmail backfill...');

    // Load WordPress orders JSON
    const dataPath = path.join(process.cwd(), 'scripts', 'migration', 'wordpress_orders.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ WordPress orders file not found: ${dataPath}`);
        process.exit(1);
    }

    const wpOrders: WPOrder[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📦 Loaded ${wpOrders.length} WordPress orders`);

    // Create a map of WP Order ID -> Email
    const wpOrderEmailMap = new Map<number, string>();
    wpOrders.forEach(order => {
        if (order.billing?.email) {
            wpOrderEmailMap.set(order.id, order.billing.email);
        }
    });
    console.log(`📧 Found ${wpOrderEmailMap.size} orders with emails`);

    // Fetch all orders from Firestore
    console.log('🔍 Fetching orders from Firestore...');
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📦 Found ${ordersSnapshot.size} orders in Firestore`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const orderDoc of ordersSnapshot.docs) {
        try {
            const orderData = orderDoc.data();
            const wpId = orderData.wpId;

            // Skip if already has customerEmail
            if (orderData.customerEmail) {
                skipped++;
                continue;
            }

            // Try to find email from WordPress data
            let email: string | null = null;
            if (wpId && wpOrderEmailMap.has(wpId)) {
                email = wpOrderEmailMap.get(wpId) || null;
            }

            // Fallback: Try to extract from shippingAddress
            if (!email && orderData.shippingAddress?.email) {
                email = orderData.shippingAddress.email;
            }

            if (email) {
                await orderDoc.ref.update({
                    customerEmail: email
                });
                updated++;
                console.log(`✅ Updated order ${orderDoc.id}: ${email}`);
            } else {
                skipped++;
                console.log(`⚠️ No email found for order ${orderDoc.id} (wpId: ${wpId})`);
            }
        } catch (error) {
            errors++;
            console.error(`❌ Error updating order ${orderDoc.id}:`, error);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('✅ Done!');
}

backfillCustomerEmails().catch(console.error);
