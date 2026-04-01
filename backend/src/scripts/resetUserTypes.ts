/**
 * Reset All Users to Empty UserType
 * Forces all users to update their profile before ordering
 * 
 * Usage:
 *   npx tsx backend/src/scripts/resetUserTypes.ts
 */

import { db } from "../config/firebase";

async function resetUserTypes() {
    console.log("🔄 Resetting all user types to empty...");

    const usersSnapshot = await db.collection("users").get();
    console.log(`📋 Found ${usersSnapshot.size} users`);

    let updated = 0;

    for (const userDoc of usersSnapshot.docs) {
        await userDoc.ref.update({
            userType: "",
            dentalDoctorInfo: null,
            studentInfo: null,
            supplierInfo: null
        });
        updated++;
        if (updated % 50 === 0) {
            console.log(`  Updated ${updated} users...`);
        }
    }

    console.log(`\n✅ Reset ${updated} users to empty userType`);
    console.log("All users will now need to update their profile before ordering.");
    process.exit(0);
}

resetUserTypes().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
