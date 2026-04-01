/**
 * One-time script to create an admin user in Firestore.
 * Run: npx tsx backend/src/scripts/createAdmin.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { db } from '../config/firebase';

const ADMIN_EMAIL = 'admin@alphadentkart.com';
const ADMIN_PASSWORD = 'Admin@123456'; // ← Change this after first login
const ADMIN_NAME = 'Alpha Dentkart Admin';

async function createAdmin() {
    console.log('🔐 Creating admin user...');

    // Check if admin already exists
    const existing = await db.collection('users')
        .where('email', '==', ADMIN_EMAIL)
        .limit(1)
        .get();

    if (!existing.empty) {
        const doc = existing.docs[0];
        const data = doc.data();
        if (data.role === 'admin') {
            console.log(`✅ Admin already exists: ${ADMIN_EMAIL} (id: ${doc.id})`);
        } else {
            // Upgrade role to admin
            await doc.ref.update({ role: 'admin', updatedAt: new Date().toISOString() });
            console.log(`✅ Upgraded existing user to admin: ${ADMIN_EMAIL}`);
        }
        process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin doc
    const docRef = await db.collection('users').add({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        phone: '',
        role: 'admin',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Admin user created!`);
    console.log(`   ID:       ${docRef.id}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   ⚠️  Change the password after first login!`);

    process.exit(0);
}

createAdmin().catch((err) => {
    console.error('❌ Failed to create admin:', err);
    process.exit(1);
});
