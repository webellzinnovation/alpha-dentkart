"use strict";
/**
 * Fix User Verification Status Script
 * Marks users as verified if they have orders or complete profiles
 *
 * Usage:
 *   npx tsx backend/src/scripts/fixUserVerification.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function fixUserVerification() {
    console.log("🔧 Fixing user verification status...");
    // Get all users
    const usersSnapshot = await firebase_1.db.collection("users").get();
    console.log(`📋 Found ${usersSnapshot.size} users`);
    // Get all orders
    const ordersSnapshot = await firebase_1.db.collection("orders").get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${orders.length} orders`);
    let updated = 0;
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userEmail = userData.email?.toLowerCase();
        // Check if user has orders
        const userHasOrders = orders.some((order) => order.customerEmail?.toLowerCase() === userEmail);
        // Check if user has complete profile
        const hasAddress = userData.addresses && userData.addresses.length > 0;
        const hasPhone = userData.phone && userData.phone.length > 0;
        // Mark as verified if has orders or complete profile
        const shouldBeVerified = userHasOrders || (hasAddress && hasPhone);
        if (shouldBeVerified && !userData.isVerified) {
            await userDoc.ref.update({
                isVerified: true,
                verificationStatus: "approved"
            });
            console.log(`  ✅ ${userData.email}: Verified (${userHasOrders ? 'has orders' : 'complete profile'})`);
            updated++;
        }
        else if (!shouldBeVerified && userData.isVerified !== false) {
            // Mark unverified if no orders and incomplete profile
            await userDoc.ref.update({
                isVerified: false,
                verificationStatus: "pending"
            });
        }
    }
    console.log(`\n✅ Updated ${updated} users with verification status`);
    process.exit(0);
}
fixUserVerification().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
//# sourceMappingURL=fixUserVerification.js.map