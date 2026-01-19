// Script to seed the database with products using RELATIONAL categories and brands
// Run with: npx tsx scripts/seed.ts

import { PrismaClient } from '@prisma/client';
import { ALL_PRODUCTS, CATEGORIES, BRAND_PROFILES } from '../constants';

const prisma = new PrismaClient();

// Real images from research
const realProductMapping: Record<string, string> = {
    "Shofu Beautifil II": "https://alphadentkart.com/wp-content/uploads/2025/07/20160901_044622b2-enamel-_-gingiva-600x378.webp",
    "Dentsply Spectrum Composite": "https://alphadentkart.com/wp-content/uploads/2023/08/dentsply-spectrum-composite-kit-4-600x378.webp",
    "3M Scotchbond Universal Adhesive": "https://alphadentkart.com/wp-content/uploads/2023/09/3MES01_SING01_01_IMG1_1-300x378.webp",
    "Apex Locator Woodpecker": "https://alphadentkart.com/wp-content/uploads/2025/07/123a10_3_9-600x378.webp",
    "GC Gold Label 9 Cement": "https://alphadentkart.com/wp-content/uploads/2023/09/GC-Gold-Label-Hybrid-600x378.webp",
    "3M Filtek Ultimate Syringe": "https://alphadentkart.com/wp-content/uploads/2023/09/filtek_z350_xt_pixlr_1_-300x300.webp",
    "Ivoclar Te-Econom Flow": "https://alphadentkart.com/wp-content/uploads/2023/09/ivo027-te-econom-flow-jeringa-2gr-portada_11zon-600x378.webp",
    "Mani Diamond Burs": "https://alphadentkart.com/wp-content/uploads/2025/06/ssde4432ded_1-600x378.webp",
    "Zhermack Tropicalgin Alginate": "https://alphadentkart.com/wp-content/uploads/2023/08/tropialgin_1-480x378.webp"
};

const unsplashPool = [
    "1598256989800", "1629909613654", "1593060558300", "1579684385127", "1583947215259"
];

async function main() {
    console.log('🌱 Starting RELATIONAL seed for scale...');

    // 1. Clear existing
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.brand.deleteMany({});

    // 2. Create Categories
    console.log('Migrating categories...');
    const categoryMap = new Map();
    for (const cat of CATEGORIES) {
        const created = await prisma.category.create({
            data: {
                name: cat.name,
                slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
                iconClass: cat.iconClass || 'fas fa-teeth'
            }
        });
        categoryMap.set(cat.name, created.id);
    }

    // 3. Create Brands
    console.log('Migrating brands...');
    const brandMap = new Map();
    for (const brand of BRAND_PROFILES) {
        const created = await prisma.brand.create({
            data: {
                name: brand.name,
                slug: brand.name.toLowerCase().replace(/\s+/g, '-'),
                logo: brand.logo,
                description: brand.description,
                productCount: brand.productCount
            }
        });
        brandMap.set(brand.name, created.id);
    }

    // 4. Create Products with relations
    console.log('Migrating products with relations...');
    for (let i = 0; i < ALL_PRODUCTS.length; i++) {
        const p = ALL_PRODUCTS[i];

        // Find category/brand ID or create if missing
        let categoryId = categoryMap.get(p.category);
        if (!categoryId && p.category) {
            const newCat = await prisma.category.upsert({
                where: { slug: p.category.toLowerCase().replace(/\s+/g, '-') },
                update: {},
                create: { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') }
            });
            categoryId = newCat.id;
            categoryMap.set(p.category, categoryId);
        }

        let brandId = p.brand ? brandMap.get(p.brand) : null;
        if (!brandId && p.brand) {
            const newBrand = await prisma.brand.upsert({
                where: { slug: p.brand.toLowerCase().replace(/\s+/g, '-') },
                update: {},
                create: { name: p.brand, slug: p.brand.toLowerCase().replace(/\s+/g, '-') }
            });
            brandId = newBrand.id;
            brandMap.set(p.brand, brandId);
        }

        let imageUrl = realProductMapping[p.name];
        if (!imageUrl) {
            const photoId = unsplashPool[i % unsplashPool.length];
            imageUrl = `https://images.unsplash.com/photo-${photoId}?q=80&w=800&auto=format&fit=crop&idx=${i}`;
        }

        await prisma.product.create({
            data: {
                name: p.name,
                price: p.price,
                originalPrice: p.originalPrice,
                rating: p.rating,
                reviews: p.reviews,
                image: imageUrl,
                images: JSON.stringify([imageUrl]),
                description: p.description || `${p.name} - Professional grade dental equipment.`,
                stock: 50,
                categoryId: categoryId || null,
                brandId: brandId || null,
                categoryName: p.category, // Legacy support
                brandName: p.brand // Legacy support
            }
        });
    }

    console.log('✅ RELATIONAL SEED COMPLETE!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
