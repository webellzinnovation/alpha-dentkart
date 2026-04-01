"use strict";
/**
 * Fix Verification Status - Strict
 * - Empty/regular userType → pending
 * - dental-doctor/student/supplier (updated) → approved
 *
 * Usage:
 *   npx tsx backend/src/scripts/fixVerificationStrict.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function fixVerificationStrict() {
    console.log("🔄 Fixing verification status strictly...");
    const usersSnapshot = await firebase_1.db.collection("users").get();
    console.log(`📋 Found ${usersSnapshot.size} users`);
    let pending = 0;
    let approved = 0;
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userType = userData.userType || '';
        // Only approve if user has UPDATED their user type (not empty, not regular)
        let newStatus = 'pending';
        if (userType && userType !== 'regular' && userType !== '') {
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
    console.log(`\n✅ Verification status fixed:`);
    console.log(`   📊 Pending (regular/empty): ${pending}`);
    console.log(`   📊 Approved (updated user type): ${approved}`);
    process.exit(0);
}
fixVerificationStrict().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
//# sourceMappingURL=fixVerificationStrict.js.map