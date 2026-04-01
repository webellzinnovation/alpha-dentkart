import { admin, db } from './backend/src/config/firebase';

async function verifyCounts() {
  console.log('Fetching Firestore collection counts...');
  try {
    const productsSnapshot = await db.collection('products').count().get();
    console.log(`✅ Products Count: ${productsSnapshot.data().count}`);

    const brandsSnapshot = await db.collection('brands').count().get();
    console.log(`✅ Brands Count: ${brandsSnapshot.data().count}`);

    const categoriesSnapshot = await db.collection('categories').count().get();
    console.log(`✅ Categories Count: ${categoriesSnapshot.data().count}`);

    const ordersSnapshot = await db.collection('orders').count().get();
    console.log(`✅ Orders Count: ${ordersSnapshot.data().count}`);

  } catch (err) {
    console.error('Error fetching counts:', err);
  } finally {
    process.exit(0);
  }
}

verifyCounts();
