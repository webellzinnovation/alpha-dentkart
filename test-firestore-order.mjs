import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve('d:/Cloud iDrive/Cloud-Drive_webellzinnovation@gmail.com/Ai studio/alpha-dentkart/firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function checkOrder() {
    try {
        const orderId = 'wp-38429';
        const doc = await db.collection('orders').doc(orderId).get();
        
        console.log(`Order ${orderId} exists:`, doc.exists);
        if (doc.exists) {
            console.log('Order Data:', doc.data());
            
            // Try updating it
            console.log('Attempting update...');
            await db.collection('orders').doc(orderId).update({
                status: 'Delivered',
                updatedAt: new Date().toISOString()
            });
            console.log('Update successful!');
        }
    } catch (e) {
        console.error('Failed:', e);
    }
}

checkOrder();
