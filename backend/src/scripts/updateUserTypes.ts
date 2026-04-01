/**
 * Update User Types - Force Update
 * Infers user type from WooCommerce billing company
 * 
 * Usage:
 *   npx tsx backend/src/scripts/updateUserTypes.ts
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { db } from "../config/firebase";

const WP_URL = process.env.WP_URL || "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || "ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031";
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || "cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1";

const api = new (WooCommerceRestApi as any).default({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
});

async function updateUserTypes() {
    console.log("🔄 Fetching WooCommerce customers...");

    // Fetch all customers
    let page = 1;
    let allCustomers: any[] = [];
    let totalPages = 1;

    do {
        const { data, headers } = await api.get("customers", { per_page: 100, page });
        allCustomers = allCustomers.concat(data);
        totalPages = parseInt(headers?.["x-wp-totalpages"] || "1", 10);
        console.log(`  Page ${page}/${totalPages}: ${allCustomers.length} customers`);
        page++;
    } while (page <= totalPages);

    console.log(`\n📋 Total customers: ${allCustomers.length}`);

    // Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();
    console.log(`📋 Total users in Firestore: ${usersSnapshot.size}`);

    let updated = 0;
    const stats = { dental: 0, supplier: 0, regular: 0 };

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userEmail = userData.email?.toLowerCase();

        // Skip admin
        if (userEmail === 'admin@alphadentkart.com') continue;

        // Find matching WooCommerce customer
        const wcCustomer = allCustomers.find((c: any) => 
            c.email?.toLowerCase() === userEmail
        );

        let userType = "regular";

        if (wcCustomer) {
            const company = wcCustomer.billing?.company || "";
            
            if (company) {
                const companyLower = company.toLowerCase();
                if (companyLower.includes("dental") || companyLower.includes("clinic") || 
                    companyLower.includes("hospital") || companyLower.includes("doctor") ||
                    companyLower.includes("medical") || companyLower.includes("healthcare")) {
                    userType = "dental-doctor";
                    stats.dental++;
                } else {
                    userType = "supplier";
                    stats.supplier++;
                }
            } else {
                stats.regular++;
            }
        } else {
            stats.regular++;
        }

        // Force update user type
        await userDoc.ref.update({ userType });
        updated++;
    }

    console.log(`\n✅ Updated ${updated} users with user type`);
    console.log(`   📊 Dental Doctors: ${stats.dental}`);
    console.log(`   📊 Suppliers: ${stats.supplier}`);
    console.log(`   📊 Regular: ${stats.regular}`);
    process.exit(0);
}

updateUserTypes().catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
});
