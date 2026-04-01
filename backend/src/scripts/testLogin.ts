/**
 * Test script to directly test auth login via Firestore.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { db } from '../config/firebase';

async function testLogin() {
    const email = 'admin@alphadentkart.com';
    const password = 'Admin@123456';

    console.log('🔍 Looking up user:', email);

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            console.log('❌ User not found in Firestore');
            process.exit(1);
        }

        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() } as any;
        console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, hasPassword: !!user.password });

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('🔑 Password valid:', validPassword);

        if (!validPassword) {
            console.log('❌ Password mismatch');
        } else {
            console.log('✅ Login would succeed! Role:', user.role);
        }
    } catch (err: any) {
        console.error('❌ Error:', err.message || err);
        console.error('Stack:', err.stack);
    }

    process.exit(0);
}

testLogin();
