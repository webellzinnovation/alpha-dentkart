import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Initialized successfully!");
  
  const db = admin.firestore();
  console.log("Fetching products...");
  const snapshot = await db.collection('products').limit(1).get();
  console.log("Success! Found products count:", snapshot.size);
} catch (err) {
  console.error("Failed with error:", err);
}
