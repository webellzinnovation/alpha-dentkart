"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../../config/firebase");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function verifyCounts() {
    console.log("🕵️ Verifying Firestore Counts...");
    const collections = ["products", "categories", "brands", "users", "orders", "reviews"];
    for (const col of collections) {
        const snapshot = await firebase_1.db.collection(col).count().get();
        console.log(`  - ${col}: ${snapshot.data().count} documents`);
    }
    process.exit(0);
}
verifyCounts().catch(console.error);
//# sourceMappingURL=verify-db.js.map