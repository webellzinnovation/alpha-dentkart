/**
 * Reset admin password in Firestore
 * Run: npx tsx backend/src/scripts/reset-admin-password.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { db } from '../config/firebase';

const ADMIN_EMAIL = 'admin@alphadentkart.com';
const NEW_PASSWORD = 'Admin@123456';

async function resetAdminPassword() {
    console.log('🔐 Resetting admin password...');

    const existing = await db.collection('users')
        .where('email', '==', ADMIN_EMAIL)
        .limit(1)
        .get();

    if (existing.empty) {
        console.log('❌ Admin user not found. Creating new admin...');
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        const docRef = await db.collection('users').add({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: 'Alpha Dentkart Admin',
            phone: '',
            role: 'admin',
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        console.log(`✅ New admin created!`);
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${NEW_PASSWORD}`);
        process.exit(0);
    }

    const doc = existing.docs[0];
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    
    await doc.ref.update({ 
        password: hashedPassword, 
        role: 'admin',
        isVerified: true,
        updatedAt: new Date().toISOString() 
    });

    console.log(`✅ Admin password reset!`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`   User ID:  ${doc.id}`);

    process.exit(0);
}

resetAdminPassword().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
