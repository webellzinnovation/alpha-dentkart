"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function main() {
    const adminEmail = 'admin@alpha-dentkart.com';
    const adminPassword = 'Admin@123';
    const adminName = 'Alpha Admin';
    const adminPhone = '9999999999';
    console.log(`🚀 Setting up Firestore admin user: ${adminEmail}...`);
    try {
        // 1. Check if user exists in Firebase Auth
        let userRecord;
        try {
            userRecord = await firebase_1.admin.auth().getUserByEmail(adminEmail);
            console.log('✅ Found existing Firebase Auth user');
            // Update password if needed (optional, here we do it to match setup script behavior)
            await firebase_1.admin.auth().updateUser(userRecord.uid, {
                password: adminPassword,
                displayName: adminName,
                phoneNumber: adminPhone.startsWith('+') ? adminPhone : `+91${adminPhone}` // Firebase Auth needs E.164
            });
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating new Firebase Auth user...');
                userRecord = await firebase_1.admin.auth().createUser({
                    email: adminEmail,
                    password: adminPassword,
                    displayName: adminName,
                    phoneNumber: adminPhone.startsWith('+') ? adminPhone : `+91${adminPhone}`
                });
            }
            else {
                throw error;
            }
        }
        // 2. Set custom claims for RBAC
        await firebase_1.admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
        console.log('✅ Admin claims set');
        // 3. Create or update user profile in Firestore
        const userRef = firebase_1.db.collection('users').doc(userRecord.uid);
        await userRef.set({
            id: userRecord.uid,
            email: adminEmail,
            name: adminName,
            phone: adminPhone,
            role: 'admin',
            isVerified: true,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('\n✅ Admin setup successful!');
        console.log(`UID: ${userRecord.uid}`);
        console.log(`Email: ${adminEmail}`);
    }
    catch (error) {
        console.error('❌ Error setting up admin:', error);
    }
    finally {
        // No disconnect needed for firebase-admin usually in scripts like this
    }
}
main();
//# sourceMappingURL=setupAdmin.js.map