"use strict";
/**
 * Check User Types Script
 */
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function checkUserTypes() {
    const usersSnapshot = await firebase_1.db.collection("users").get();
    const userTypes = {};
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
//# sourceMappingURL=checkUserTypes.js.map