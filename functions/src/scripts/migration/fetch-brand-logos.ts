/**
 * Fetches brand logos from the first product image of each brand in Firestore.
 * Run with: npx tsx functions/src/scripts/migration/fetch-brand-logos.ts
 */
import { db } from '../../config/firebase';

async function fetchMissingLogos() {
    console.log('🔍 Fetching brand logos from product images...\n');

    // Get all brands
    const brandsSnap = await db.collection('brands').get();
    const brands = brandsSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        logo: d.data().logo || d.data().image || ''
    }));

    const missingLogos = brands.filter(b => !b.logo);
    console.log(`Found ${brands.length} total brands, ${missingLogos.length} missing logos\n`);

    // Get all products (we'll use them to find brand logos)
    const productsSnap = await db.collection('products').get();
    console.log(`Loaded ${productsSnap.size} products`);

    // Build a map of brand -> first product image
    const brandLogos = new Map<string, string>();
    productsSnap.docs.forEach(doc => {
        const p = doc.data();
        const brandName = typeof p.brand === 'object' ? p.brand?.name : p.brand;
        if (brandName && !brandLogos.has(brandName.toLowerCase()) && p.image) {
            brandLogos.set(brandName.toLowerCase(), p.image);
        }
    });

    console.log(`Found logos for ${brandLogos.size} brands from products\n`);

    let updated = 0;
    let notFound = 0;

    for (const brand of missingLogos) {
        const logo = brandLogos.get(brand.name.toLowerCase());
        if (logo) {
            await db.collection('brands').doc(brand.id).update({ image: logo, updatedAt: new Date() });
            console.log(`  ✅ ${brand.name} -> ${logo.substring(0, 60)}...`);
            updated++;
        } else {
            console.log(`  ❌ ${brand.name} -> no products with image`);
            notFound++;
        }
    }

    console.log(`\n✅ Done! Updated ${updated} brands, ${notFound} not found.`);
}

fetchMissingLogos().catch(console.error);
