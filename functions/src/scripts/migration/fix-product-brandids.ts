/**
 * One-time script to fix missing brandId fields on products.
 * Run with: npx tsx functions/src/scripts/migration/fix-product-brandids.ts
 */
import { db } from '../../config/firebase';

async function fixBrandIds() {
    console.log('🔧 Fixing product brandId fields...\n');

    // Load all brands into a map (lowercase name -> id)
    const brandsSnap = await db.collection('brands').get();
    const brandNameToId = new Map<string, string>();
    brandsSnap.forEach(doc => {
        const data = doc.data();
        if (data.name) brandNameToId.set(data.name.toLowerCase(), doc.id);
    });
    console.log(`Loaded ${brandNameToId.size} brands`);

    // Get all products
    const productsSnap = await db.collection('products').get();
    console.log(`Found ${productsSnap.size} products\n`);

    let updated = 0;
    let alreadyCorrect = 0;
    let noBrandMatch = 0;

    // Process in batches of 500
    for (let i = 0; i < productsSnap.docs.length; i += 500) {
        const batch = db.batch();
        const chunk = productsSnap.docs.slice(i, i + 500);

        for (const doc of chunk) {
            const data = doc.data();
            const brandName = data.brand || data.brandName || '';
            const currentBrandId = data.brandId;

            if (!brandName) {
                noBrandMatch++;
                continue;
            }

            const expectedBrandId = brandNameToId.get(brandName.toLowerCase());

            if (expectedBrandId && String(currentBrandId) !== String(expectedBrandId)) {
                batch.update(doc.ref, {
                    brandId: expectedBrandId,
                    brandName: brandName,
                    updatedAt: new Date()
                });
                updated++;
            } else if (currentBrandId) {
                alreadyCorrect++;
            } else if (!expectedBrandId) {
                noBrandMatch++;
            }
        }

        if (updated > 0 || i === 0) {
            await batch.commit();
            console.log(`Processed ${Math.min(i + 500, productsSnap.docs.length)}/${productsSnap.docs.length}...`);
        }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Already correct: ${alreadyCorrect}`);
    console.log(`   No brand match: ${noBrandMatch}`);
}

fixBrandIds().catch(console.error);
