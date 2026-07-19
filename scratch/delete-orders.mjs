import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve('firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('firebase-service-account.json not found in workspace!');
    process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const ordersToDelete = [
    'DsyEr91I5ETfn75yRxUB',
    'hsSwYKeO9cWGfw6Scquf',
    'g6sMpY7jffFrqlzvQoub',
    '5T1xrysBwXGpBhGryro1'
];

async function deleteOrders() {
    console.log('Starting deletion of invalid orders from Firestore...');
    const batch = db.batch();
    
    for (const orderId of ordersToDelete) {
        const docRef = db.collection('orders').doc(orderId);
        const doc = await docRef.get();
        if (doc.exists) {
            console.log(`- Found Order ID: ${orderId} (Customer: ${doc.data().customerName || 'N/A'}, Total: ${doc.data().total || 0})`);
            batch.delete(docRef);
        } else {
            console.log(`- Order ID: ${orderId} does not exist in the collection.`);
        }
    }

    await batch.commit();
    console.log('Successfully deleted the specified invalid orders.');
}

deleteOrders().catch(console.error);
