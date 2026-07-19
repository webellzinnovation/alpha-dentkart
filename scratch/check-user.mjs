import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
    console.log("🔍 Checking for test_user_2026@alpha.com...");
    const snapshot = await db.collection('users').where('email', '==', 'test_user_2026@alpha.com').get();
    if (snapshot.empty) {
        console.log("❌ User not found in Firestore.");
    } else {
        console.log("✅ User found!");
        snapshot.forEach(doc => {
            console.log("ID:", doc.id);
            console.log("Data:", doc.data());
        });
    }
    process.exit(0);
}

checkUser().catch(err => {
    console.error("Error checking user:", err);
    process.exit(1);
});
