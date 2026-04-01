"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function test() {
    const serviceAccountPath = path_1.default.join(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
    if (!firebase_admin_1.default.apps.length) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount)
        });
    }
    const db = firebase_admin_1.default.firestore();
    console.log('--- Current Settings (settings/store) ---');
    const doc = await db.doc('settings/store').get();
    if (doc.exists) {
        console.log(JSON.stringify(doc.data(), null, 2));
    }
    else {
        console.log('Document settings/store DOES NOT EXIST');
    }
}
test().catch(console.error);
//# sourceMappingURL=test-settings.js.map