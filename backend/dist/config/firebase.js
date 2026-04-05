"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseInitialized = exports.auth = exports.db = exports.admin = void 0;
exports.withTimeout = withTimeout;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// Initialize Firebase Admin
let db;
let auth;
let firebaseInitialized = false;
try {
    // Check if already initialized
    if (firebase_admin_1.default.apps.length === 0) {
        // Priority 1: Environment Variable (Vercel Production)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Admin initialized from Environment Variable');
            firebaseInitialized = true;
        }
        // Priority 2: Local File (Development)
        else {
            const serviceAccountPath = path_1.default.join(process.cwd(), 'firebase-service-account.json');
            if (fs_1.default.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin initialized from Local File');
                firebaseInitialized = true;
            }
            else {
                console.warn('⚠️ No Firebase Service Account found. Database calls will fail.');
                console.warn('   Place firebase-service-account.json in project root, or set FIREBASE_SERVICE_ACCOUNT env var.');
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
exports.isFirebaseInitialized = firebaseInitialized;
async function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase operation timed out')), ms));
    return Promise.race([promise, timeout]);
}
//# sourceMappingURL=firebase.js.map