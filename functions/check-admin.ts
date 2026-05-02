
import * as dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/firebase';

async function checkAdmin() {
    const email = 'admin@alphadentkart.com';
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
        console.log(`❌ User ${email} NOT FOUND in Firestore.`);
    } else {
        const user = snapshot.docs[0].data();
        console.log(`✅ User FOUND:`, {
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            hasPassword: !!user.password
        });
    }
    process.exit(0);
}

checkAdmin();
