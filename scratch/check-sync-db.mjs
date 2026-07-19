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

async function run() {
    try {
        console.log('Checking product 39201 in Firestore...');
        const doc1 = await db.collection('products').doc('39201').get();
        console.log('Doc ID 39201 exists:', doc1.exists);
        if (doc1.exists) {
            console.log('Doc ID 39201 Data:', doc1.data());
        }

        const doc2 = await db.collection('products').doc('wp-39201').get();
        console.log('Doc ID wp-39201 exists:', doc2.exists);
        if (doc2.exists) {
            console.log('Doc ID wp-39201 Data:', doc2.data());
        }

    } catch (err) {
        console.error('Error querying Firestore:', err);
    }
}

run();
