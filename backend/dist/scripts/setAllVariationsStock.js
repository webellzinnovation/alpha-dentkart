"use strict";
/**
 * Update all product variations to have stock: 10
 * Usage: npx tsx setAllVariationsStock.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
async function updateAllVariationsStock() {
    console.log('🔄 Updating all variation stocks to 10...\n');
    const productsRef = firebase_1.db.collection('products');
    const snapshot = await productsRef.get();
    console.log(`Found ${snapshot.size} products`);
    let updated = 0;
    let variationsFound = 0;
    for (const doc of snapshot.docs) {
        const product = doc.data();
        if (product.variations && product.variations.length > 0) {
            variationsFound += product.variations.length;
            const updatedVariations = product.variations.map((v) => ({
                ...v,
                stock: 10
            }));
            await doc.ref.update({ variations: updatedVariations });
            updated++;
            if (updated % 50 === 0) {
                console.log(`Updated ${updated} products with variations...`);
            }
        }
    }
    console.log(`\n✅ Updated ${updated} products with ${variationsFound} total variations to stock: 10`);
}
updateAllVariationsStock()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=setAllVariationsStock.js.map