
import { db } from "../../config/firebase";
import dotenv from "dotenv";

dotenv.config();

async function verifyCounts() {
    console.log("🕵️ Verifying Firestore Counts...");

    const collections = ["products", "categories", "brands", "users", "orders", "reviews"];

    for (const col of collections) {
        const snapshot = await db.collection(col).count().get();
        console.log(`  - ${col}: ${snapshot.data().count} documents`);
    }

    process.exit(0);
}

verifyCounts().catch(console.error);
