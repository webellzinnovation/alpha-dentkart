import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

async function test() {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    
    console.log('--- Current Settings (settings/store) ---');
    const doc = await db.doc('settings/store').get();
    if (doc.exists) {
        console.log(JSON.stringify(doc.data(), null, 2));
    } else {
        console.log('Document settings/store DOES NOT EXIST');
    }
}

test().catch(console.error);
