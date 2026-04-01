/**
 * Fix User Orders Script
 * Links orders to users and updates order count
 * 
 * Usage:
 *   npx tsx backend/src/scripts/fixUserOrders.ts
 */

import { db } from "../config/firebase";
import admin from "firebase-admin";

async function fixUserOrders() {
    console.log("🔧 Fixing user order counts...");

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`📋 Found ${usersSnapshot.size} users`);

    // Get all orders
    const ordersSnapshot = await db.collection("orders").get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${orders.length} orders`);

    let updated = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userEmail = userData.email?.toLowerCase();
        const userName = userData.name?.toLowerCase();

        // Find orders for this user by matching email or name
        const userOrders = orders.filter((order: any) => {
            const orderEmail = order.customerEmail?.toLowerCase();
            const orderName = order.customerName?.toLowerCase();
            return orderEmail === userEmail || orderName === userName;
        });

        if (userOrders.length > 0) {
            const orderIds = userOrders.map((o: any) => o.wpId || o.id);
            const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

            await userDoc.ref.update({
                orders: orderIds,
                totalSpent: totalSpent,
                orderCount: userOrders.length
            });

            console.log(`  ✅ ${userData.email}: ${userOrders.length} orders (₹${totalSpent})`);
            updated++;
        }
    }

    console.log(`\n✅ Updated ${updated} users with order information`);
    process.exit(0);
}

fixUserOrders().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
