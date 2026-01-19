// Bulk Migration Script for 2700+ Products
// Usage: npx tsx scripts/migration_import.ts path/to/your/data.json

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Please provide a path to the data.json file');
        process.exit(1);
    }

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ File not found: ${absolutePath}`);
        process.exit(1);
    }

    try {
        console.log(`\n📦 Initializing Bulk Migration from: ${path.basename(absolutePath)}`);
        const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

        // Data can be an array of products or the WP export format
        const rawProducts = Array.isArray(data) ? data : (data.products || []);

        console.log(`📝 Total items detected: ${rawProducts.length}`);

        // 1. Extract and Upsert Categories/Brands first (Efficiency)
        const categories = [...new Set(rawProducts.map((p: any) => p.category).filter(Boolean))];
        const brands = [...new Set(rawProducts.map((p: any) => p.brand).filter(Boolean))];

        console.log(`🔍 Found ${categories.length} Categories and ${brands.length} Brands.`);

        const categoryMap = new Map();
        for (const catName of categories) {
            const cat = await prisma.category.upsert({
                where: { name: catName as string },
                update: {},
                create: {
                    name: catName as string,
                    slug: (catName as string).toLowerCase().replace(/\s+/g, '-')
                }
            });
            categoryMap.set(catName, cat.id);
        }

        const brandMap = new Map();
        for (const brandName of brands) {
            const Brand = await prisma.brand.upsert({
                where: { name: brandName as string },
                update: {},
                create: {
                    name: brandName as string,
                    slug: (brandName as string).toLowerCase().replace(/\s+/g, '-')
                }
            });
            brandMap.set(brandName, Brand.id);
        }

        // 2. Batch Import Products
        console.log('🚀 Importing products in batches...');
        let importedCount = 0;
        const BATCH_SIZE = 50;

        for (let i = 0; i < rawProducts.length; i += BATCH_SIZE) {
            const batch = rawProducts.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map((p: any) => {
                return prisma.product.create({
                    data: {
                        name: p.name,
                        price: parseFloat(p.price) || 0,
                        originalPrice: parseFloat(p.originalPrice) || null,
                        categoryName: p.category,
                        brandName: p.brand,
                        categoryId: categoryMap.get(p.category),
                        brandId: brandMap.get(p.brand),
                        image: p.image || 'https://placehold.co/600x600?text=No+Image',
                        images: JSON.stringify(p.images || [p.image]),
                        description: p.description || p.name,
                        stock: parseInt(p.stock) || 100,
                        badge: p.badge,
                        badgeColor: p.badgeColor
                    }
                }).catch(err => {
                    console.error(`⚠️ Failed to import: ${p.name}`, err.message);
                });
            }));

            importedCount += batch.length;
            process.stdout.write(`\r✅ Progress: ${importedCount}/${rawProducts.length}`);
        }

        console.log('\n\n✨ MIGRATION SUCCESSFUL!');
        console.log(`🏁 Total Imported: ${importedCount} items.`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importData();
