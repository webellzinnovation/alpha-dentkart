import { Router, Request, Response } from 'express';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { admin, db } from '../config/firebase';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { cacheService } from '../services/cacheService';

dotenv.config();

const router = Router();

export async function getWooClient() {
    let url = (process.env.WP_URL || "https://alphadentkart.com").replace(/\/$/, '');
    let consumerKey = process.env.WP_CONSUMER_KEY || '';
    let consumerSecret = process.env.WP_CONSUMER_SECRET || '';

    try {
        let doc = await db.collection('settings').doc('wordpress_credentials').get();
        if (doc.exists) {
            const data = doc.data();
            if (data?.siteUrl) url = data.siteUrl.replace(/\/$/, '');
            if (data?.consumerKey) consumerKey = data.consumerKey;
            if (data?.consumerSecret) consumerSecret = data.consumerSecret;
        } else {
            // Fallback to settings/wordpress_sync
            doc = await db.collection('settings').doc('wordpress_sync').get();
            if (doc.exists) {
                const data = doc.data();
                if (data?.apiUrl || data?.siteUrl) {
                    url = (data.apiUrl || data.siteUrl).replace(/\/$/, '');
                }
                if (data?.consumerKey) consumerKey = data.consumerKey;
                if (data?.consumerSecret) consumerSecret = data.consumerSecret;
            }
        }
    } catch (e) {
        logger.warn('Could not read wordpress_credentials or wordpress_sync from Firestore, using env vars', { error: e });
    }

    const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;
    return new (WC as any)({
        url,
        consumerKey,
        consumerSecret,
        version: "wc/v3",
        queryStringAuth: true,
        axiosConfig: { timeout: 60000 }
    });
}

const BATCH_SIZE = 100;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAll(api: any, endpoint: string, params: Record<string, any> = {}): Promise<any[]> {
    let page = 1;
    let results: any[] = [];
    let totalPages = 1;
    const cleanEndpoint = endpoint.replace(/^\//, '');

    try {
        do {
            const { data, headers } = await api.get(cleanEndpoint, { ...params, per_page: BATCH_SIZE, page });
            if (data && Array.isArray(data)) {
                results = results.concat(data);
            }
            totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
            page++;
            if (page <= totalPages) await sleep(100);
        } while (page <= totalPages);
    } catch (error: any) {
        logger.error(`Error fetching from ${endpoint}:`, { error: error?.response?.data || error?.message });
        throw error;
    }

    return results;
}

async function getLastSyncTime(type: string): Promise<Date | null> {
    try {
        const doc = await db.collection('settings').doc('sync_status').get();
        if (doc.exists) {
            const data = doc.data();
            if (data && data[type]) {
                const timestamp = data[type];
                return typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
            }
        }
    } catch (e) {
        logger.warn(`Could not fetch last sync time for ${type}`, { error: e });
    }
    return null;
}

async function updateLastSyncTime(type: string, time: Date = new Date()) {
    try {
        await db.collection('settings').doc('sync_status').set({
            [type]: admin.firestore.Timestamp.fromDate(time),
            [`${type}_last_success`]: admin.firestore.Timestamp.fromDate(new Date())
        }, { merge: true });
    } catch (e) {
        logger.error(`Failed to update last sync time for ${type}`, { error: e });
    }
}

export async function syncProducts(api: any, forceFull = false): Promise<number> {
    logger.info("📦 Fetching products from WooCommerce...");
    
    // Pre-load brands map (name -> id) and (wpId -> name) for brandId assignment
    const brandsSnap = await db.collection('brands').get();
    const brandNameToId = new Map<string, string>();
    const brandWpIdToName = new Map<number, string>();
    brandsSnap.forEach(doc => {
        const data = doc.data();
        if (data.name) brandNameToId.set(data.name.toLowerCase(), doc.id);
        if (data.wpId) brandWpIdToName.set(data.wpId, data.name);
    });
    logger.info(`Loaded ${brandNameToId.size} brands for ID lookup`);
    
    const params: any = { status: "any" };
    const lastSync = !forceFull ? await getLastSyncTime('lastProductSync') : null;
    
    if (lastSync) {
        // Go back 10 minutes to handle overlaps/clock drift
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching products modified after ${params.after}`);
    }

    let products = await fetchAll(api, "/products", params);
    logger.info(`Found ${products.length} products from general fetch`);

    // Also fetch products per brand using WC API brand filter
    // This ensures we get ALL products even if brands field isn't populated on most products
    const allBrandWpIds = Array.from(brandWpIdToName.keys());
    if (allBrandWpIds.length > 0) {
        logger.info(`🏷️ Fetching products per brand (${allBrandWpIds.length} brands)...`);
        const existingWpIds = new Set(products.map((p: any) => p.id));
        let brandProductsAdded = 0;

        for (const brandWpId of allBrandWpIds) {
            try {
                const brandProducts = await fetchAll(api, "/products", { 
                    ...params, 
                    brand: brandWpId,
                    per_page: 100 
                });
                for (const bp of brandProducts) {
                    if (!existingWpIds.has(bp.id)) {
                        products.push(bp);
                        existingWpIds.add(bp.id);
                        brandProductsAdded++;
                    }
                }
                if (brandProducts.length > 0) {
                    logger.info(`   ↳ Brand wpId ${brandWpId} (${brandWpIdToName.get(brandWpId)}): ${brandProducts.length} products`);
                }
                await sleep(100); // Rate limit
            } catch (e) {
                // Some brands may not exist as filter param, ignore
            }
        }
        logger.info(`Added ${brandProductsAdded} products from per-brand fetches`);
    }

    logger.info(`Total products to sync: ${products.length}`);
    if (products.length === 0) return 0;

    let synced = 0;
    const getOriginalImageUrl = (url: string): string => {
        if (!url) return '';
        return url.replace(/-(\d+)x(\d+)\.(\w+)$/, '.$3');
    };

    // Parallel processing with limited concurrency for variations
    const processBatch = async (items: any[]) => {
        const batch = db.batch();
        
        // Pre-fetch all variations in parallel for variable products in this batch
        const variableItems = items.filter(p => p.type === 'variable');
        const variationsMap = new Map<number, any[]>();
        
        if (variableItems.length > 0) {
            logger.info(`   ↳ Parallel fetching variations for ${variableItems.length} products...`);
            // Fetch variations with concurrency limit of 5
            for (let i = 0; i < variableItems.length; i += 5) {
                const chunk = variableItems.slice(i, i + 5);
                await Promise.all(chunk.map(async (p) => {
                    try {
                        const vars = await fetchAll(api, `/products/${p.id}/variations`);
                        variationsMap.set(p.id, vars);
                    } catch (err) {
                        logger.warn(`      ⚠️ Failed variations for ${p.id}`, { error: err });
                    }
                }));
            }
        }

        for (const product of items) {
            const imageUrls = product.images?.map((img: any) => getOriginalImageUrl(img.src)) || [];
            const variations: any[] = [];
            
            const fetchedVars = variationsMap.get(product.id);
            if (fetchedVars) {
                variations.push(...fetchedVars.map((v: any) => ({
                    id: String(v.id),
                    price: parseFloat(v.price) || 0,
                    regularPrice: parseFloat(v.regular_price) || 0,
                    salePrice: parseFloat(v.sale_price) || null,
                    stock: v.manage_stock ? (v.stock_quantity ?? 0) : (v.stock_status === 'instock' ? 999 : 0),
                    stockStatus: v.stock_status,
                    sku: v.sku || '',
                    image: v.image?.src || '',
                    attributes: v.attributes || []
                })));
            }

            const brandName = product.brands?.[0]?.name || 
                            product.attributes?.find((a: any) => a.slug === 'pa_brand' || a.name.toLowerCase() === 'brand')?.options?.[0] ||
                            product.tags?.[0]?.name || '';

            // Look up brandId from the brands collection using WC brand ID first, then name
            const wcBrandId = product.brands?.[0]?.id;
            let brandId = null;
            let resolvedBrandName = brandName;
            
            // Try WC brand ID -> Firestore brand document
            if (wcBrandId) {
                const firestoreBrandId = String(wcBrandId);
                const firestoreBrandName = brandWpIdToName.get(wcBrandId);
                if (firestoreBrandName) {
                    brandId = firestoreBrandId;
                    resolvedBrandName = firestoreBrandName;
                }
            }
            
            // Fallback: try name lookup
            if (!brandId && brandName) {
                brandId = brandNameToId.get(brandName.toLowerCase()) || null;
                // If name lookup found a brand, use the Firestore name (which may differ from WC name)
                if (brandId) {
                    const fbName = brandsSnap.docs.find(d => d.id === brandId)?.data()?.name;
                    if (fbName) resolvedBrandName = fbName;
                }
            }

            const productData = {
                wpId: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDescription: product.short_description,
                price: parseFloat(product.price) || 0,
                salePrice: parseFloat(product.sale_price) || parseFloat(product.price) || 0,
                originalPrice: parseFloat(product.regular_price) || parseFloat(product.price) || 0,
                stock: product.manage_stock ? (product.stock_quantity ?? 0) : (product.stock_status === 'instock' ? 999 : 0),
                stockStatus: product.stock_status,
                sku: product.sku || '',
                image: imageUrls[0] || '',
                images: imageUrls,
                category: product.categories?.[0]?.name || 'Dental',
                categoryId: product.categories?.[0]?.id || null,
                brand: resolvedBrandName,
                brandId: brandId,
                brandName: resolvedBrandName,
                type: product.type,
                status: product.status,
                createdAt: new Date(product.date_created),
                updatedAt: new Date(product.date_modified),
                lastSync: new Date(),
                reviews: product.rating_count || 0,
                rating: parseFloat(product.average_rating) || 0,
                specs: {
                    weight: product.weight || '',
                    dimensions: product.dimensions || {},
                    sku: product.sku || '',
                    manageStock: product.manage_stock
                },
                features: [],
                attributes: product.attributes || [],
                variations: variations,
                source: 'wordpress_sync'
            };

            const productRef = db.collection('products').doc(String(product.id));
            batch.set(productRef, productData, { merge: true });
        }
        
        await batch.commit();
    };

    // Process all products in batches of 50
    for (let i = 0; i < products.length; i += 50) {
        const chunk = products.slice(i, i + 50);
        await processBatch(chunk);
        synced += chunk.length;
        logger.info(`Synced ${synced}/${products.length} products`);
        await sleep(200);
    }

    await updateLastSyncTime('lastProductSync');
    return synced;
}

export async function syncOrders(api: any, forceFull = false): Promise<number> {
    logger.info("📋 Fetching orders from WooCommerce...");
    
    const params: any = { per_page: 100 };
    const lastSync = !forceFull ? await getLastSyncTime('lastOrderSync') : null;
    
    if (lastSync) {
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching orders modified after ${params.after}`);
    }

    const orders = await fetchAll(api, "/orders", params);
    logger.info(`Found ${orders.length} orders to sync`);

    if (orders.length === 0) return 0;

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const order of orders) {
        const customer = order.billing;
        const orderData = {
            wpId: order.id,
            orderNumber: order.number,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingAddress: {
                firstName: customer.first_name,
                lastName: customer.last_name,
                address1: customer.address_1,
                address2: customer.address_2,
                city: customer.city,
                state: customer.state,
                postcode: customer.postcode,
                country: customer.country
            },
            billingAddress: {
                firstName: customer.first_name,
                lastName: customer.last_name,
                address1: customer.address_1,
                address2: customer.address_2,
                city: customer.city,
                state: customer.state,
                postcode: customer.postcode,
                country: customer.country
            },
            items: order.line_items.map((item: any) => ({
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            })),
            subtotal: parseFloat(order.subtotal),
            shipping: parseFloat(order.shipping_total),
            tax: parseFloat(order.total_tax),
            total: parseFloat(order.total),
            status: order.status === 'processing' ? 'Processing' :
                    order.status === 'completed' ? 'Delivered' :
                    order.status === 'cancelled' || order.status === 'failed' || order.status === 'refunded' ? 'Cancelled' :
                    order.status === 'shipped' ? 'Shipped' : 'Processing',
            paymentMethod: order.payment_method_title,
            paymentStatus: order.payment_status === 'paid' ? 'paid' : 'pending',
            date: order.date_created || new Date().toISOString(),
            createdAt: new Date(order.date_created),
            updatedAt: new Date(order.date_modified),
            lastSync: new Date(),
            source: 'wordpress_sync'
        };

        const orderRef = db.collection('orders').doc(String(order.id));
        batch.set(orderRef, orderData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            batch = db.batch();
            countInBatch = 0;
            await sleep(200);
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    await updateLastSyncTime('lastOrderSync');
    return synced;
}

export async function syncUsers(api: any, forceFull = false): Promise<number> {
    logger.info("👥 Fetching customers from WooCommerce...");
    
    const params: any = { per_page: 100 };
    const lastSync = !forceFull ? await getLastSyncTime('lastUserSync') : null;
    
    if (lastSync) {
        const afterDate = new Date(lastSync.getTime() - 10 * 60 * 1000);
        params.after = afterDate.toISOString();
        logger.info(`Incremental sync: fetching users modified after ${params.after}`);
    }

    const customers = await fetchAll(api, "/customers", params);
    logger.info(`Found ${customers.length} customers to sync`);

    if (customers.length === 0) return 0;

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const customer of customers) {
        const billing = customer.billing;
        const userData = {
            wpId: customer.id,
            email: customer.email,
            name: `${customer.first_name} ${customer.last_name}`,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: billing?.phone || '',
            addresses: [{
                type: 'billing',
                firstName: billing?.first_name || '',
                lastName: billing?.last_name || '',
                address1: billing?.address_1 || '',
                address2: billing?.address_2 || '',
                city: billing?.city || '',
                state: billing?.state || '',
                postcode: billing?.postcode || '',
                country: billing?.country || '',
                phone: billing?.phone || ''
            }],
            role: 'customer',
            isVerified: true,
            createdAt: new Date(customer.date_created),
            lastSync: new Date(),
            source: 'wordpress_sync'
        };

        const userRef = db.collection('users').doc(String(customer.id));
        batch.set(userRef, userData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            batch = db.batch();
            countInBatch = 0;
            await sleep(200);
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    await updateLastSyncTime('lastUserSync');
    return synced;
}

export async function syncCategories(api: any): Promise<number> {
    logger.info("📂 Fetching categories from WooCommerce...");
    const categories = await fetchAll(api, "/products/categories", { per_page: 100 });
    logger.info(`Found ${categories.length} categories`);

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const cat of categories) {
        const categoryData = {
            wpId: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image?.src || '',
            parent: cat.parent || 0,
            count: cat.count || 0,
            lastSync: new Date(),
            updatedAt: new Date(),
            source: 'wordpress_sync'
        };

        const catRef = db.collection('categories').doc(String(cat.id));
        batch.set(catRef, categoryData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            logger.info(`Synced ${synced}/${categories.length} categories`);
            batch = db.batch();
            countInBatch = 0;
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    logger.info(`✅ Synced ${synced} categories`);
    return synced;
}

async function searchBrandLogo(api: any, brandName: string): Promise<string> {
    const cleanName = brandName.replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const slugName = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Try multiple search patterns
    const searchTerms = [
        cleanName,
        cleanName + ' logo',
        slugName + '-logo',
        slugName,
        cleanName.replace(/\s+/g, '_') + '_logo',
    ];

    for (const term of searchTerms) {
        try {
            const { data } = await api.get('/wp/v2/media', { search: term, per_page: 5, orderby: 'relevance' });
            if (data && data.length > 0) {
                // Find best match - prefer images with brand name in title or slug
                for (const media of data) {
                    if (media.mime_type?.startsWith('image/') && media.source_url) {
                        const title = (media.title?.rendered || '').toLowerCase();
                        const mediaSlug = (media.slug || '').toLowerCase();
                        const brandLower = brandName.toLowerCase();
                        // Check if media title or slug contains the brand name
                        if (title.includes(brandLower) || mediaSlug.includes(slugName) ||
                            title.includes(cleanName.toLowerCase()) || mediaSlug.includes(cleanName.toLowerCase().replace(/\s+/g, '-'))) {
                            return media.source_url;
                        }
                    }
                }
                // Fallback: return first image result
                const firstImage = data.find((m: any) => m.mime_type?.startsWith('image/') && m.source_url);
                if (firstImage) return firstImage.source_url;
            }
        } catch (e) {
            // Ignore errors, try next term
        }
    }
    return '';
}

function isValidBrandName(name: string): boolean {
    const n = (name || '').trim();
    if (!n) return false;
    // Reject sizes, quantities, units
    if (/^\(.*\)$/.test(n)) return false;
    if (/^\d/.test(n)) return false;
    if (/\b(pcs?|pieces?|box|boxes|sticks?|rolls?|sheets?|feet|foot|holes?|ml|gm?|gms?|mm|cm|oz|litre|liter|ltr|kg|kgs|pack\s*of|per\s+set|per\s+box|per\s+pack)\b/i.test(n)) return false;
    // Strict whitelist of known dental companies/manufacturers (exact match, case-insensitive)
    const KNOWN_BRANDS = new Set([
        '3m', '3m espe', '3m unitek', '3m oral care',
        'dentsply', 'dentsply sirona',
        'coltene', 'coltene whaledent',
        'ivoclar', 'ivoclar vivadent',
        'kerr', 'kerr dental',
        'shofu',
        'gc', 'gc corporation', 'gc america',
        'dmg', 'dmg america',
        'bisco',
        'pentron', 'pentron clinical',
        'ultradent',
        'voco',
        'angelus',
        'bausch',
        'cavex',
        'colgate',
        'd-tech',
        'harvard', 'harvard dental',
        'hayashi', 'hayashi dental',
        'indus dental',
        'jmorita', 'j. morita',
        'kulzer',
        'marksans',
        'meta biomed',
        'mg dental',
        'micro mega',
        'noris medical',
        'nyk dental',
        'odontos',
        'premier', 'premier dental',
        'ptc',
        'pyrax',
        'raman dental',
        'raypex',
        'richardson',
        'septodont',
        'ss white',
        'sun medical',
        'tpc',
        'trox',
        'zhermack',
        'waldent',
        'alpok',
        'alphadent',
        'dental avenue',
        'dentalor',
        'mane',
        'medent',
        'prime dental',
        'sanghi',
        'surya',
        'ticare',
        'trevon',
        'venus',
        'verdant',
        'woodpecker',
        'woson',
        'yeti',
        'dentium',
        'osstem',
        'straumann',
        'nobel biocare',
        'ankybss',
        'tomy',
        'polydent',
        'roland',
        'prevest denpro', 'prevestdenpro',
        'safeendo',
        'goodwill',
        'bionova',
        'gdc',
        'oracura',
        'eighteeth',
        'polodent',
        'neoendo',
        'kovo dent',
        'denmax', 'denmax medical',
        'dispodent',
        'lascod',
        'fgm',
        'maarc',
        'riverside',
        'browne',
        'detax',
        'wizdent',
        'being foshan',
        'ams',
        'surgicare',
        'seil global',
        'romsons',
        'carestream',
        'vatech',
        'hmd',
        'nsk',
        'superendo',
        'vishal dentocare',
        'samit',
        'kids e dental',
        'capri',
        'cotisen',
        'icpa',
        'suraksha',
        'indoco',
        'kalabhai',
        'advanced biotech',
        'endoking',
        'prima dental',
        'mailyard',
        'printex',
        'agkem',
        'kovident',
        'steris',
        'unident',
        'denpro',
        'koden',
        'dpi',
        'mani',
        'aaa dental',
        'dentaurum',
        'aquapick',
        'vincismile',
        'sdi',
        'sure endo',
        'hu-friedy', 'hu.friedy',
        'ethicon',
        'life.line medical',
        'dynamic techno',
        'supersnap',
        'diadent',
        'ammdent',
        'tor vm',
        'avue',
        'apple dental',
        'roeko',
        'canalpro',
        'medicept',
        'gutta',
        'metabiomed',
        'mectron',
        'element',
        'tiodent',
        'henry schein',
        'fdent',
        'ulp dental',
        'veirs dental',
        'vox',
        'edfdent', 'edfdental',
        'dentplus',
        'dentalkart',
        'denta port',
    ]);
    const lower = n.toLowerCase();
    return KNOWN_BRANDS.has(lower);
}

export async function updateBrandProductCounts(): Promise<number> {
    logger.info("🔢 Recalculating brand product counts from Firestore...");
    const brandsSnap = await db.collection('brands').get();
    let updated = 0;

    for (const brandDoc of brandsSnap.docs) {
        const brandData = brandDoc.data();
        const brandName = brandData.name;
        if (!brandName) continue;

        // Count products with this brand name
        const productsSnap = await db.collection('products')
            .where('brand', '==', brandName)
            .count()
            .get();
        const actualCount = productsSnap.data().count;

        // Also try brandId-based count
        const productsByIdSnap = await db.collection('products')
            .where('brandId', '==', brandDoc.id)
            .count()
            .get();
        const countById = productsByIdSnap.data().count;

        const finalCount = Math.max(actualCount, countById);

        if (brandData.count !== finalCount || brandData.productCount !== finalCount) {
            await db.collection('brands').doc(brandDoc.id).update({
                count: finalCount,
                productCount: finalCount,
                updatedAt: new Date(),
            });
            updated++;
        }
    }

    logger.info(`Updated product counts for ${updated} brands`);
    return updated;
}

export async function syncBrands(api: any): Promise<number> {
    logger.info("🏷️ Fetching tags (brands) from WooCommerce...");
    const tags = await fetchAll(api, "/products/tags", { per_page: 100 });
    logger.info(`Found ${tags.length} tags in WooCommerce`);
    
    // Also try to fetch from pa_brand attribute if available
    let brandsFromAttr: any[] = [];
    try {
        logger.info("🏷️ Checking for pa_brand attribute terms...");
        const { data: attributes } = await api.get("products/attributes");
        const brandAttr = attributes.find((a: any) => 
            a.slug === "pa_brand" || a.slug === "brand" || a.name.toLowerCase() === "brand"
        );
        if (brandAttr) {
            brandsFromAttr = await fetchAll(api, `products/attributes/${brandAttr.id}/terms`);
            logger.info(`Found ${brandsFromAttr.length} brand terms in attributes`);
        }
    } catch (err) {
        logger.info("   ⏭️ pa_brand attribute not found or inaccessible");
    }

    const allBrandTerms = [...tags, ...brandsFromAttr];
    const uniqueBrands = Array.from(new Map(allBrandTerms.map(item => [item.name, item])).values());
    const filteredBrands = uniqueBrands.filter((b: any) => isValidBrandName(b.name));
    logger.info(`Processing ${filteredBrands.length} valid brands (filtered from ${uniqueBrands.length} total)`);

    let synced = 0;
    let batch = db.batch();
    let countInBatch = 0;

    for (const brand of filteredBrands) {
        let logoUrl = brand.image?.src || '';
        // If no logo from WooCommerce, search WordPress media
        if (!logoUrl) {
            try {
                logoUrl = await searchBrandLogo(api, brand.name);
                if (logoUrl) {
                    logger.info(`   🔍 Found logo for "${brand.name}": ${logoUrl}`);
                }
                // Rate limit: wait 200ms between logo searches
                await sleep(200);
            } catch (e) {
                // Ignore search errors
            }
        }

        const brandData = {
            wpId: brand.id,
            name: brand.name,
            slug: brand.slug,
            description: brand.description || '',
            image: logoUrl,
            count: brand.count || 0,
            lastSync: new Date(),
            updatedAt: new Date(),
            source: 'wordpress_sync'
        };

        const brandRef = db.collection('brands').doc(String(brand.id));
        batch.set(brandRef, brandData, { merge: true });
        synced++;
        countInBatch++;

        if (countInBatch >= 50) {
            await batch.commit();
            logger.info(`Synced ${synced}/${filteredBrands.length} brands`);
            batch = db.batch();
            countInBatch = 0;
        }
    }

    if (countInBatch > 0) {
        await batch.commit();
    }
    
    logger.info(`✅ Synced ${synced} brands`);
    return synced;
}

router.post('/test-connection', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { siteUrl, consumerKey, consumerSecret } = req.body;
        if (!siteUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ success: false, error: 'Site URL and API credentials are required' });
        }

        const cleanSiteUrl = siteUrl.replace(/\/$/, '');
        const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;
        const testApi = new (WC as any)({
            url: cleanSiteUrl,
            consumerKey,
            consumerSecret,
            version: 'wc/v3',
            queryStringAuth: true,
            axiosConfig: { timeout: 30000 }
        });

        const response = await testApi.get('products', { per_page: 1 });
        const total = response.headers?.['x-wp-total'] || 0;
        
        res.json({ success: true, total, message: `Connected successfully! Found ${total} products.` });
    } catch (error: any) {
        logger.error('WooCommerce API connection test failed:', error);
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/credentials', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { siteUrl, consumerKey, consumerSecret } = req.body;
        if (!siteUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ success: false, error: 'Site URL and API credentials are required' });
        }

        await db.collection('settings').doc('wordpress_credentials').set({
            siteUrl,
            consumerKey,
            consumerSecret,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({ success: true, message: 'WooCommerce credentials saved successfully' });
    } catch (error: any) {
        logger.error('Failed to save WooCommerce credentials:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/credentials', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        let doc = await db.collection('settings').doc('wordpress_credentials').get();
        if (!doc.exists) {
            // Fallback to wordpress_sync document
            doc = await db.collection('settings').doc('wordpress_sync').get();
        }
        if (doc.exists) {
            const data = doc.data();
            res.json({
                success: true,
                credentials: {
                    siteUrl: data?.siteUrl || '',
                    consumerKey: data?.consumerKey ? (data.consumerKey.substring(0, 5) + '...') : '',
                    hasSecret: !!data?.consumerSecret
                }
            });
        } else {
            res.json({ success: true, credentials: null });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/status', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const doc = await db.collection('settings').doc('sync_status').get();
        res.json({ success: true, status: doc.exists ? doc.data() : null });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/products', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting product sync (forceFull: ${forceFull})...`);
        const api = await getWooClient();
        const synced = await syncProducts(api, forceFull);
        // Invalidate products cache
        await cacheService.invalidateProductsCache();
        res.json({ success: true, synced, message: `Synced ${synced} products from WordPress` });
    } catch (error: any) {
        logger.error('Product sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/orders', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting order sync (forceFull: ${forceFull})...`);
        const api = await getWooClient();
        const synced = await syncOrders(api, forceFull);
        res.json({ success: true, synced, message: `Synced ${synced} orders from WordPress` });
    } catch (error: any) {
        logger.error('Order sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/users', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting user sync (forceFull: ${forceFull})...`);
        const api = await getWooClient();
        const synced = await syncUsers(api, forceFull);
        res.json({ success: true, synced, message: `Synced ${synced} users from WordPress` });
    } catch (error: any) {
        logger.error('User sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/categories', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        logger.info("Starting category sync...");
        const api = await getWooClient();
        const synced = await syncCategories(api);
        // Invalidate categories and dependent products cache
        await cacheService.invalidateCategoriesCache();
        res.json({ success: true, synced, message: `Synced ${synced} categories from WordPress` });
    } catch (error: any) {
        logger.error('Category sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/brands', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        logger.info("Starting brand sync...");
        const api = await getWooClient();
        const synced = await syncBrands(api);
        // Invalidate brands and dependent products cache
        await cacheService.invalidateBrandsCache();
        res.json({ success: true, synced, message: `Synced ${synced} brands from WordPress` });
    } catch (error: any) {
        logger.error('Brand sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/brand-counts', apiLimiter, authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
        logger.info("🔢 Recalculating brand product counts...");
        const updated = await updateBrandProductCounts();
        res.json({ success: true, updated, message: `Updated product counts for ${updated} brands` });
    } catch (error: any) {
        logger.error('Brand count update error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg });
    }
});

router.post('/full', apiLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const results: any = { categories: 0, brands: 0, products: 0, orders: 0, users: 0 };
    const errors: string[] = [];
    
    try {
        const forceFull = req.query.force === 'true';
        logger.info(`Starting full sync (forceFull: ${forceFull})...`);
        const api = await getWooClient();
        
        try {
            results.categories = await syncCategories(api);
        } catch (e: any) {
            errors.push('categories: ' + (e?.message || 'unknown'));
            logger.error('Category sync failed', { error: e });
        }

        try {
            results.brands = await syncBrands(api);
        } catch (e: any) {
            errors.push('brands: ' + (e?.message || 'unknown'));
            logger.error('Brand sync failed', { error: e });
        }
        
        try {
            logger.info("Starting products sync...");
            results.products = await syncProducts(api, forceFull);
        } catch (e: any) {
            errors.push('products: ' + (e?.message || 'unknown'));
            logger.error('Product sync failed', { error: e });
        }
        
        try {
            logger.info("Starting orders and users sync...");
            const [ordersSynced, usersSynced] = await Promise.all([
                syncOrders(api, forceFull).catch(e => { errors.push('orders: ' + (e?.message || 'unknown')); return 0; }),
                syncUsers(api, forceFull).catch(e => { errors.push('users: ' + (e?.message || 'unknown')); return 0; })
            ]);
            results.orders = ordersSynced;
            results.users = usersSynced;
        } catch (e: any) {
            errors.push('orders/users: ' + (e?.message || 'unknown'));
        }

        // Invalidate all caches
        try {
            await Promise.all([
                cacheService.invalidateProductsCache(),
                cacheService.invalidateCategoriesCache(),
                cacheService.invalidateBrandsCache()
            ]);
        } catch (e) {
            logger.warn('Cache invalidation failed', { error: e });
        }

        // Recalculate brand product counts from actual products
        try {
            results.brandCountsUpdated = await updateBrandProductCounts();
        } catch (e) {
            logger.warn('Brand product count update failed', { error: e });
        }

        res.json({
            success: true,
            ...results,
            errors: errors.length > 0 ? errors : undefined,
            message: errors.length > 0 
                ? `Sync completed with ${errors.length} errors` 
                : 'Full sync completed successfully'
        });
    } catch (error: any) {
        logger.error('Full sync error', { error });
        const errMsg = error?.response?.data?.message || error?.message || String(error);
        res.status(500).json({ success: false, error: errMsg, results, errors });
    }
});

export default router;