/**
 * One-time migration script: Denormalize category and brand names into product documents.
 *
 * This eliminates 2 Firestore reads per product during getAllProducts/getProductById,
 * drastically reducing daily read quota usage.
 *
 * Run once: npx tsx backend/src/scripts/denormalizeProducts.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

const BATCH_SIZE = 100;

async function denormalizeProducts() {
    console.log('🚀 Starting product denormalization...');

    // 1. Build category lookup map: id -> name
    console.log('📂 Loading categories...');
    const categoryMap: Map<string, string> = new Map();
    const catSnap = await db.collection('categories').get();
    catSnap.docs.forEach(doc => {
        const data = doc.data();
        categoryMap.set(doc.id, data.name || '');
    });
    console.log(`   Found ${categoryMap.size} categories`);

    // 2. Build brand lookup map: id -> name
    console.log('🏷️  Loading brands...');
    const brandMap: Map<string, string> = new Map();
    const brandSnap = await db.collection('brands').get();
    brandSnap.docs.forEach(doc => {
        const data = doc.data();
        brandMap.set(doc.id, data.name || '');
    });
    console.log(`   Found ${brandMap.size} brands`);

    // 3. Stream through all products in pages and batch-update
    console.log('📦 Updating product documents...');

    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let page = 0;

    while (true) {
        page++;
        let query = db.collection('products').orderBy('__name__').limit(BATCH_SIZE);
        if (lastDoc) query = query.startAfter(lastDoc);

        const snap = await query.get();
        if (snap.empty) break;

        lastDoc = snap.docs[snap.docs.length - 1];
        totalProcessed += snap.docs.length;

        const batch = db.batch();
        let batchCount = 0;

        for (const doc of snap.docs) {
            const data = doc.data();
            const updates: Record<string, string> = {};

            // Resolve category name
            const categoryId = data.categoryId ? String(data.categoryId) : null;
            if (categoryId && categoryMap.has(categoryId)) {
                const resolvedName = categoryMap.get(categoryId)!;
                // Only update if not already set correctly
                if (data.categoryName !== resolvedName) {
                    updates.categoryName = resolvedName;
                }
            }

            // Resolve brand name
            const brandId = data.brandId ? String(data.brandId) : null;
            if (brandId && brandMap.has(brandId)) {
                const resolvedName = brandMap.get(brandId)!;
                if (data.brandName !== resolvedName) {
                    updates.brandName = resolvedName;
                }
            } else if (data.brand && typeof data.brand === 'string' && !data.brandName) {
                // Fallback: use existing brand field
                updates.brandName = data.brand;
            }

            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                batchCount++;
                totalUpdated++;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`   Page ${page}: processed ${snap.docs.length} products (${batchCount} updated) — total: ${totalProcessed}`);

        if (snap.docs.length < BATCH_SIZE) break;
    }

    console.log('');
    console.log('✅ Denormalization complete!');
    console.log(`   Total products processed: ${totalProcessed}`);
    console.log(`   Total products updated:   ${totalUpdated}`);
    console.log('');
    console.log('Next step: Restart the backend server. The product controller');
    console.log('will now use categoryName/brandName fields directly — no sub-queries.');

    process.exit(0);
}

denormalizeProducts().catch(err => {
    console.error('❌ Denormalization failed:', err.message || err);
    process.exit(1);
});
