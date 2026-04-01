"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function migrateProducts() {
    console.log('🚀 Starting Product Migration...');
    const dataPath = path_1.default.join(process.cwd(), 'migration', 'wordpress_products.json');
    if (!fs_1.default.existsSync(dataPath)) {
        console.error(`❌ Data file not found at: ${dataPath}`);
        console.log('Please export your WordPress products to JSON and save it there.');
        process.exit(1);
    }
    const products = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
    console.log(`📦 Found ${products.length} products to migrate.`);
    const batchSize = 10;
    let processed = 0;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const promises = batch.map(async (p) => {
            try {
                // 1. Prepare Data
                const firestoreProduct = {
                    wpId: p.id, // Keep reference to old ID
                    name: p.name,
                    slug: p.slug, // Crucial for SEO 301 redirects
                    description: p.description,
                    shortDescription: p.short_description,
                    price: parseFloat(p.price || '0'),
                    regularPrice: parseFloat(p.regular_price || '0'),
                    salePrice: parseFloat(p.sale_price || '0'),
                    sku: p.sku || `WP-${p.id}`,
                    stock: p.stock_quantity || 0,
                    outOfStock: p.stock_status !== 'instock',
                    categoryId: p.categories[0]?.id || null, // Map first category
                    categoryName: p.categories[0]?.name || 'Uncategorized',
                    images: p.images.map(img => img.src), // For now use direct URLs. Phase 2: Upload to Firebase Storage
                    features: [], // WP doesn't strictly have features, maybe map attributes
                    specs: {
                        weight: p.weight,
                        dimensions: p.dimensions
                    },
                    rating: 0,
                    reviewsCount: 0,
                    createdAt: new Date(p.date_created).toISOString(),
                    updatedAt: new Date().toISOString()
                };
                // 2. Add to Firestore
                // We use the WP ID as the doc ID to make relationship mapping easier later
                await firebase_1.db.collection('products').doc(String(p.id)).set(firestoreProduct);
                process.stdout.write('.');
            }
            catch (err) {
                console.error(`\n❌ Failed to migrate product ${p.name}:`, err);
            }
        });
        await Promise.all(promises);
        processed += batch.length;
        console.log(`\nProcessed ${processed}/${products.length}`);
    }
    console.log('\n✅ Product Migration Complete!');
}
migrateProducts().catch(console.error);
//# sourceMappingURL=migrateProducts.js.map