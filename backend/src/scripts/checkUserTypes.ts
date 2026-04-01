/**
 * Check User Types Script
 */

import { db } from "../config/firebase";

async function checkUserTypes() {
    const usersSnapshot = await db.collection("users").get();
    
    const userTypes: Record<string, number> = {};
    
    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        const ut = data.userType || 'undefined';
        userTypes[ut] = (userTypes[ut] || 0) + 1;
        
        if (data.email?.includes('admin')) {
            console.log(`Admin user: ${data.email} - ${ut}`);
        }
    }
    
    console.log("\nUser Types:");
    Object.entries(userTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    
    process.exit(0);
}

checkUserTypes().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
