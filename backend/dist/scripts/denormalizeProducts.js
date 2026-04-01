"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * One-time migration script: Denormalize category and brand names into product documents.
 *
 * This eliminates 2 Firestore reads per product during getAllProducts/getProductById,
 * drastically reducing daily read quota usage.
 *
 * Run once: npx tsx backend/src/scripts/denormalizeProducts.ts
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const firebase_1 = require("../config/firebase");
const BATCH_SIZE = 100;
async function denormalizeProducts() {
    console.log('🚀 Starting product denormalization...');
    // 1. Build category lookup map: id -> name
    console.log('📂 Loading categories...');
    const categoryMap = new Map();
    const catSnap = await firebase_1.db.collection('categories').get();
    catSnap.docs.forEach(doc => {
        const data = doc.data();
        categoryMap.set(doc.id, data.name || '');
    });
    console.log(`   Found ${categoryMap.size} categories`);
    // 2. Build brand lookup map: id -> name
    console.log('🏷️  Loading brands...');
    const brandMap = new Map();
    const brandSnap = await firebase_1.db.collection('brands').get();
    brandSnap.docs.forEach(doc => {
        const data = doc.data();
        brandMap.set(doc.id, data.name || '');
    });
    console.log(`   Found ${brandMap.size} brands`);
    // 3. Stream through all products in pages and batch-update
    console.log('📦 Updating product documents...');
    let lastDoc = null;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let page = 0;
    while (true) {
        page++;
        let query = firebase_1.db.collection('products').orderBy('__name__').limit(BATCH_SIZE);
        if (lastDoc)
            query = query.startAfter(lastDoc);
        const snap = await query.get();
        if (snap.empty)
            break;
        lastDoc = snap.docs[snap.docs.length - 1];
        totalProcessed += snap.docs.length;
        const batch = firebase_1.db.batch();
        let batchCount = 0;
        for (const doc of snap.docs) {
            const data = doc.data();
            const updates = {};
            // Resolve category name
            const categoryId = data.categoryId ? String(data.categoryId) : null;
            if (categoryId && categoryMap.has(categoryId)) {
                const resolvedName = categoryMap.get(categoryId);
                // Only update if not already set correctly
                if (data.categoryName !== resolvedName) {
                    updates.categoryName = resolvedName;
                }
            }
            // Resolve brand name
            const brandId = data.brandId ? String(data.brandId) : null;
            if (brandId && brandMap.has(brandId)) {
                const resolvedName = brandMap.get(brandId);
                if (data.brandName !== resolvedName) {
                    updates.brandName = resolvedName;
                }
            }
            else if (data.brand && typeof data.brand === 'string' && !data.brandName) {
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
        if (snap.docs.length < BATCH_SIZE)
            break;
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
//# sourceMappingURL=denormalizeProducts.js.map