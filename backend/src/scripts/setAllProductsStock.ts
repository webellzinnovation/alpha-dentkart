/**
 * Update all products to have stock: 10
 * Usage: npx tsx backend/src/scripts/setAllProductsStock.ts
 */

import { db } from '../config/firebase';
import admin from 'firebase-admin';

async function updateAllProductsStock() {
  console.log('🔄 Updating all products to have stock: 10...\n');

  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  console.log(`Found ${snapshot.size} products`);

  let updated = 0;
  let batch = db.batch();
  const batchSize = 50;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { stock: 10 });
    updated++;

    if (updated % batchSize === 0) {
      await batch.commit();
      console.log(`Updated ${updated}/${snapshot.size} products...`);
      batch = db.batch(); // Create new batch after commit
    }
  }

  // Commit remaining updates
  if (updated % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Successfully updated ${updated} products to have stock: 10`);
}

updateAllProductsStock()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
