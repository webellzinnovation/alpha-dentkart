
import * as dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { db } from './src/config/firebase';

async function verifyAdminPassword() {
    const email = 'admin@alphadentkart.com';
    const passwordToTest = 'admin123';
    
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
        console.log(`❌ User ${email} NOT FOUND.`);
        process.exit(1);
    }
    
    const user = snapshot.docs[0].data();
    const isValid = await bcrypt.compare(passwordToTest, user.password);
    
    if (isValid) {
        console.log(`✅ Password 'admin123' is CORRECT for ${email}.`);
    } else {
        console.log(`❌ Password 'admin123' is INCORRECT for ${email}.`);
        console.log(`   Trying 'Admin@123456'...`);
        const isValid2 = await bcrypt.compare('Admin@123456', user.password);
        if (isValid2) {
            console.log(`✅ Password 'Admin@123456' is CORRECT for ${email}.`);
        } else {
            console.log(`❌ 'Admin@123456' is also INCORRECT.`);
        }
    }
    process.exit(0);
}

verifyAdminPassword();
