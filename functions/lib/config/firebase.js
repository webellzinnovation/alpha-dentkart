"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = exports.admin = void 0;
exports.withTimeout = withTimeout;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// In CommonJS, __dirname and __filename are natively available. No need for url imports.
// Initialize Firebase Admin
let db;
let auth;
let firebaseInitialized = false;
try {
    // Check if already initialized
    if (firebase_admin_1.default.apps.length === 0) {
        // Priority 1: Firebase Functions Production
        if (process.env.FIREBASE_CONFIG) {
            firebase_admin_1.default.initializeApp();
            console.log('🔥 Firebase Admin initialized via native FIREBASE_CONFIG');
            firebaseInitialized = true;
        }
        // Priority 2: Environment Variable (Vercel/Custom Production)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Admin initialized from Environment Variable');
            firebaseInitialized = true;
        }
        // Priority 3: Local File (Development)
        else {
            const possiblePaths = [
                path_1.default.join(process.cwd(), 'firebase-service-account.json'),
                path_1.default.join(process.cwd(), '..', 'firebase-service-account.json'),
                path_1.default.join(__dirname, '..', '..', '..', 'firebase-service-account.json')
            ];
            let serviceAccountPath = '';
            for (const p of possiblePaths) {
                if (fs_1.default.existsSync(p)) {
                    serviceAccountPath = p;
                    break;
                }
            }
            if (serviceAccountPath) {
                const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin initialized from Local File:', serviceAccountPath);
                firebaseInitialized = true;
            }
            else {
                console.warn('⚠️ No Firebase Service Account found. Database calls will fail.');
                console.warn('   Checked paths:', possiblePaths);
            }
        }
    }
    else {
        firebaseInitialized = true;
    }
    if (firebaseInitialized) {
        exports.db = db = firebase_admin_1.default.firestore();
        exports.auth = auth = firebase_admin_1.default.auth();
    }
    else {
        // Create proxy objects that throw helpful errors instead of crashing at startup
        const notInitializedHandler = {
            get: (_target, prop) => {
                if (prop === 'then')
                    return undefined; // Prevent Promise-like behavior
                return (..._args) => {
                    throw new Error('Firebase is not initialized. Please provide firebase-service-account.json in the project root or set FIREBASE_SERVICE_ACCOUNT environment variable.');
                };
            }
        };
        exports.db = db = new Proxy({}, notInitializedHandler);
        exports.auth = auth = new Proxy({}, notInitializedHandler);
    }
}
catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
    throw error;
}
/**
 * Wraps a Firestore promise with a timeout to prevent indefinite hangs
 * when Firebase retries quota-exhausted requests (which can take 40-60 seconds).
 *
 * Usage: const result = await withTimeout(db.collection('products').get());
 */
function withTimeout(promise, ms = 5000) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Firebase operation timed out after ${ms}ms`)), ms));
    return Promise.race([promise, timeout]);
}
//# sourceMappingURL=firebase.js.map