/**
 * Backfill Keywords Script
 *
 * One-time script to populate the `keywords` array on all existing products
 * in Firestore, enabling keyword-based search.
 *
 * Usage: npx ts-node backend/src/scripts/backfillKeywords.ts
 */

import { db } from '../config/firebase';
import { generateKeywords } from '../utils/generateKeywords';

async function backfillKeywords() {
    console.log('🔄 Starting keyword backfill for all products...\n');

    const productsSnapshot = await db.collection('products').get();
    const total = productsSnapshot.size;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of productsSnapshot.docs) {
        try {
            const data = doc.data();
            const name = data.name || '';
            const description = data.description || '';
            const brand = data.brand || '';
            const category = data.category || '';

            // Generate keywords from product data
            const keywords = generateKeywords(`${name} ${brand} ${category} ${description}`);

            if (keywords.length === 0) {
                skipped++;
                continue;
            }

            batch.update(doc.ref, { keywords });
            batchCount++;
            updated++;

            // Commit when batch is full
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`  ✅ Committed batch (${updated}/${total} products processed)`);
                batch = db.batch();
                batchCount = 0;
            }
        } catch (err) {
            errors++;
            console.error(`  ❌ Error processing product ${doc.id}:`, err);
        }
    }

    // Commit remaining
    if (batchCount > 0) {
        await batch.commit();
    }

    console.log('\n📊 Backfill Complete:');
    console.log(`   Total products: ${total}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (no keywords): ${skipped}`);
    console.log(`   Errors: ${errors}`);
}

backfillKeywords()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Fatal error:', err);
        process.exit(1);
    });
