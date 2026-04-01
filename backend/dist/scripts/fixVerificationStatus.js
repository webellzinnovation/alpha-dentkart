"use strict";
/**
 * Fix Verification Status Based on User Type and Delivered Orders
 * - Empty/regular userType + no delivered orders → pending
 * - User type updated (dental-doctor/student/supplier) OR has delivered orders → approved
 *
 * Usage:
 *   npx tsx backend/src/scripts/fixVerificationStatus.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function fixVerificationStatus() {
    console.log("🔄 Fixing verification status based on user type and orders...");
    // Get all users
    const usersSnapshot = await firebase_1.db.collection("users").get();
    console.log(`📋 Found ${usersSnapshot.size} users`);
    // Get all orders to check for delivered orders
    const ordersSnapshot = await firebase_1.db.collection("orders").get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${orders.length} orders`);
    let pending = 0;
    let approved = 0;
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userEmail = userData.email?.toLowerCase();
        const userType = userData.userType || '';
        // Check if user has delivered orders
        const userHasDeliveredOrder = orders.some((order) => order.customerEmail?.toLowerCase() === userEmail &&
            order.status === 'Delivered');
        // Approved if: has user type (not empty/regular) OR has delivered orders
        let newStatus = 'pending';
        if ((userType && userType !== 'regular' && userType !== '') || userHasDeliveredOrder) {
            newStatus = 'approved';
        }
        if (newStatus !== userData.verificationStatus) {
            await userDoc.ref.update({
                verificationStatus: newStatus,
                isVerified: newStatus === 'approved'
            });
            if (newStatus === 'pending')
                pending++;
            else
                approved++;
        }
    }
    console.log(`\n✅ Verification status updated:`);
    console.log(`   📊 Pending: ${pending}`);
    console.log(`   📊 Approved: ${approved}`);
    process.exit(0);
}
fixVerificationStatus().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
//# sourceMappingURL=fixVerificationStatus.js.map