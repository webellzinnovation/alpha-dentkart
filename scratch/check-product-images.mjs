import admin from 'firebase-admin';
import fs from 'fs';

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSpecificProducts() {
  const names = [
    "Dpi Heat Cure Liquid 4 Ltr Tin",
    "DPI Apexfill Resin Based Radiopaque Root Canal sealer",
    "Dpi Mercury - 30 gm",
    "DPI Curex Blue LightCure Nano Hybrid Composite"
  ];
  
  console.log("🔍 Checking specific products from Firestore...");
  
  for (const name of names) {
    const snapshot = await db.collection('products')
      .where('name', '==', name)
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      // Try case-insensitive search or contains search
      console.log(`\nProduct not found exactly: "${name}". Searching...`);
      const allSnap = await db.collection('products').get();
      let found = false;
      for (const d of allSnap.docs) {
        const dData = d.data();
        if (dData.name && dData.name.toLowerCase().includes(name.toLowerCase().substring(0, 15))) {
          console.log(`Found match: "${dData.name}"`);
          console.log(`Image field: "${dData.image}"`);
          console.log(`Images list:`, dData.images);
          found = true;
          break;
        }
      }
      if (!found) console.log(`No match found for: "${name}"`);
    } else {
      const data = snapshot.docs[0].data();
      console.log(`\nProduct: "${data.name}"`);
      console.log(`Image field: "${data.image}"`);
      console.log(`Images list:`, data.images);
    }
  }
}

checkSpecificProducts().catch(console.error);
