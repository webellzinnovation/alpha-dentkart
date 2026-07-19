import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('alphadentkart-001-firebase-adminsdk-fbsvc-758351d780.json', 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Initialized successfully!");
  
  const db = admin.firestore();
  console.log("Fetching featured brands...");
  const snapshot = await db.collection('brands').where('isFeatured', '==', true).get();
  console.log(`Success! Found ${snapshot.size} featured brands:`);
  snapshot.docs.forEach(doc => {
    console.log(`- ${doc.id}: ${doc.data().name} (featuredOrder: ${doc.data().featuredOrder})`);
  });
} catch (err) {
  console.error("Failed with error:", err);
}
