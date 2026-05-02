
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function countProducts() {
  const snapshot = await db.collection('products').count().get();
  console.log('Total Products:', snapshot.data().count);
  process.exit(0);
}

countProducts();
