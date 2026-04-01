const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });
} catch (e) {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
}

const db = admin.firestore();

async function updateAllStocks() {
    console.log('Fetching all products from Firestore...');
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        console.log('No products found.');
        return;
    }

    console.log(`Found ${snapshot.size} products. Starting update...`);
    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        batch.update(doc.ref, { stock: 20 });
        count++;
    });

    await batch.commit();
    console.log(`✅ Successfully updated ${count} products to have stock: 20`);
    process.exit(0);
}

updateAllStocks().catch(console.error);
