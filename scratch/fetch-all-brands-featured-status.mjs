import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('alphadentkart-001-firebase-adminsdk-fbsvc-758351d780.json', 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Initialized successfully!");
  
  const db = admin.firestore();
  console.log("Fetching all brands to check featured status...");
  const snapshot = await db.collection('brands').get();
  console.log(`Found ${snapshot.size} total brands in DB.`);
  
  const truthyBrands = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.isFeatured) {
      truthyBrands.push({
        id: doc.id,
        name: data.name,
        isFeatured: data.isFeatured,
        isFeaturedType: typeof data.isFeatured
      });
    }
  });
  
  console.log(`Found ${truthyBrands.length} brands with truthy isFeatured:`);
  truthyBrands.forEach(b => {
    console.log(`- ${b.id}: ${b.name} (isFeatured: ${b.isFeatured}, type: ${b.isFeaturedType})`);
  });
} catch (err) {
  console.error("Failed with error:", err);
}
