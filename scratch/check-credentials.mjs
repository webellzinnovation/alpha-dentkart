import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin using root service account
const serviceAccountPath = path.resolve('firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function check() {
    try {
        const credentialsDoc = await db.collection('settings').doc('wordpress_credentials').get();
        console.log('wordpress_credentials doc exists:', credentialsDoc.exists);
        if (credentialsDoc.exists) {
            const data = credentialsDoc.data();
            console.log('Stored Site URL:', data?.siteUrl);
            console.log('Stored Consumer Key:', data?.consumerKey ? '***PRESENT***' : '***MISSING***');
            console.log('Stored Consumer Secret:', data?.consumerSecret ? '***PRESENT***' : '***MISSING***');
        } else {
            console.log('No settings/wordpress_credentials doc found in Firestore.');
        }
        
        const syncStatusDoc = await db.collection('settings').doc('sync_status').get();
        console.log('sync_status doc exists:', syncStatusDoc.exists);
        if (syncStatusDoc.exists) {
            console.log('Sync Status data:', syncStatusDoc.data());
        }
    } catch (e) {
        console.error('Failed to query Firestore settings:', e);
    }
}
check();
