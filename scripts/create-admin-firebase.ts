// Script to create admin user in Firebase
// Run with: npx tsx scripts/create-admin-firebase.ts

import { db } from '../backend/src/config/firebase';
import bcrypt from 'bcrypt';

async function createAdmin() {
    const email = process.argv[2] || 'admin@alphadentkart.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (!snapshot.empty) {
            // Update existing user to admin
            const docId = snapshot.docs[0].id;
            await usersRef.doc(docId).update({
                role: 'admin',
                isVerified: true,
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Updated user ${email} to admin role`);
        } else {
            // Create new admin user
            await usersRef.add({
                email,
                password: hashedPassword,
                name,
                phone: '+91 99999 99999',
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isVerified: true
            });
            console.log(`✅ Admin user created: ${email} / ${password}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdmin();
