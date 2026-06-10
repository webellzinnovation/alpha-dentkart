/**
 * One-time script to remove invalid brands from Firestore.
 * Run with: npx tsx functions/src/scripts/migration/cleanup-brands.ts
 */
import { admin, db } from '../../config/firebase';

function isValidBrandName(name: string): boolean {
    const n = (name || '').trim();
    if (!n) return false;
    if (/^\(.*\)$/.test(n)) return false;
    if (/^\d/.test(n)) return false;
    if (/\b(pcs?|pieces?|box|boxes|sticks?|rolls?|sheets?|feet|foot|holes?|ml|gm?|gms?|mm|cm|oz|litre|liter|ltr|kg|kgs|pack\s*of|per\s+set|per\s+box|per\s+pack)\b/i.test(n)) return false;
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

async function cleanupBrands() {
    console.log('🧹 Starting brands cleanup...');
    const snapshot = await db.collection('brands').get();
    console.log(`Found ${snapshot.size} total brands`);

    const toDelete: string[] = [];
    const toKeep: { id: string; name: string }[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        if (isValidBrandName(data.name)) {
            toKeep.push({ id: doc.id, name: data.name });
        } else {
            toDelete.push(doc.id);
        }
    });

    console.log(`\n✅ Keeping ${toKeep.length} valid brands:`);
    toKeep.forEach(b => console.log(`   - ${b.name} (${b.id})`));
    console.log(`\n❌ Deleting ${toDelete.length} invalid brands`);

    if (toDelete.length === 0) {
        console.log('Nothing to delete. Done!');
        return;
    }

    // Delete in batches of 500 (Firestore limit)
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 500) {
        const batch = db.batch();
        const chunk = toDelete.slice(i, i + 500);
        chunk.forEach(id => {
            batch.delete(db.collection('brands').doc(id));
        });
        await batch.commit();
        deleted += chunk.length;
        console.log(`   Deleted ${deleted}/${toDelete.length}...`);
    }

    console.log(`\n✅ Cleanup complete. Deleted ${deleted} invalid brands, kept ${toKeep.length} valid brands.`);
}

cleanupBrands().catch(console.error);
