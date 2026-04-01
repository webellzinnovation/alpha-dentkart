const admin = require('firebase-admin');
const path = require('path');
const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });
} catch (e) {
    if (!admin.apps.length) admin.initializeApp();
}
const db = admin.firestore();

async function checkProduct() {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.limit(1).get();
    if (snapshot.empty) {
        console.log('No products found.');
        process.exit(0);
    }
    const data = snapshot.docs[0].data();
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

checkProduct().catch(console.error);
