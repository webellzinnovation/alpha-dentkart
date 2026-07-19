import admin from 'firebase-admin';

try {
  admin.initializeApp({
    projectId: 'alphadentkart-001'
  });
  console.log("Initialized default successfully with project ID!");
  const db = admin.firestore();
  console.log("Fetching products...");
  const snapshot = await db.collection('products').limit(1).get();
  console.log("Success! Found products count:", snapshot.size);
} catch (err) {
  console.error("Failed with error:", err.message);
}
