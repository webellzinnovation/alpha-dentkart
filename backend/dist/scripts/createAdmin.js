"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * One-time script to create an admin user in Firestore.
 * Run: npx tsx backend/src/scripts/createAdmin.ts
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const firebase_1 = require("../config/firebase");
const ADMIN_EMAIL = 'admin@alphadentkart.com';
const ADMIN_PASSWORD = 'Admin@123456'; // ← Change this after first login
const ADMIN_NAME = 'Alpha Dentkart Admin';
async function createAdmin() {
    console.log('🔐 Creating admin user...');
    // Check if admin already exists
    const existing = await firebase_1.db.collection('users')
        .where('email', '==', ADMIN_EMAIL)
        .limit(1)
        .get();
    if (!existing.empty) {
        const doc = existing.docs[0];
        const data = doc.data();
        if (data.role === 'admin') {
            console.log(`✅ Admin already exists: ${ADMIN_EMAIL} (id: ${doc.id})`);
        }
        else {
            // Upgrade role to admin
            await doc.ref.update({ role: 'admin', updatedAt: new Date().toISOString() });
            console.log(`✅ Upgraded existing user to admin: ${ADMIN_EMAIL}`);
        }
        process.exit(0);
    }
    // Hash password
    const hashedPassword = await bcrypt_1.default.hash(ADMIN_PASSWORD, 10);
    // Create admin doc
    const docRef = await firebase_1.db.collection('users').add({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        phone: '',
        role: 'admin',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Admin user created!`);
    console.log(`   ID:       ${docRef.id}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   ⚠️  Change the password after first login!`);
    process.exit(0);
}
createAdmin().catch((err) => {
    console.error('❌ Failed to create admin:', err);
    process.exit(1);
});
//# sourceMappingURL=createAdmin.js.map