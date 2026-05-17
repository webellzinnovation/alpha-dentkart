import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// In CommonJS, __dirname and __filename are natively available. No need for url imports.

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let firebaseInitialized = false;

try {
    // Check if already initialized
    if (admin.apps.length === 0) {
        // Priority 1: Firebase Functions Production
        if (process.env.FIREBASE_CONFIG) {
            admin.initializeApp();
            console.log('🔥 Firebase Admin initialized via native FIREBASE_CONFIG');
            firebaseInitialized = true;
        }
        // Priority 2: Environment Variable (Vercel/Custom Production)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Admin initialized from Environment Variable');
            firebaseInitialized = true;
        }
        // Priority 3: Local File (Development)
        else {
            const possiblePaths = [
                path.join(process.cwd(), 'firebase-service-account.json'),
                path.join(process.cwd(), '..', 'firebase-service-account.json'),
                path.join(__dirname, '..', '..', '..', 'firebase-service-account.json')
            ];

            let serviceAccountPath = '';
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    serviceAccountPath = p;
                    break;
                }
            }

            if (serviceAccountPath) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin initialized from Local File:', serviceAccountPath);
                firebaseInitialized = true;
            } else {
                console.warn('⚠️ No Firebase Service Account found. Database calls will fail.');
                console.warn('   Checked paths:', possiblePaths);
            }
        }
    } else {
        firebaseInitialized = true;
    }

    if (firebaseInitialized) {
        db = admin.firestore();
        auth = admin.auth();
    } else {
        // Create proxy objects that throw helpful errors instead of crashing at startup
        const notInitializedHandler = {
            get: (_target: any, prop: string) => {
                if (prop === 'then') return undefined; // Prevent Promise-like behavior
                return (..._args: any[]) => {
                    throw new Error(
                        'Firebase is not initialized. Please provide firebase-service-account.json in the project root or set FIREBASE_SERVICE_ACCOUNT environment variable.'
                    );
                };
            }
        };
        db = new Proxy({} as admin.firestore.Firestore, notInitializedHandler);
        auth = new Proxy({} as admin.auth.Auth, notInitializedHandler);
    }

} catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
    throw error;
}

export { admin, db, auth };
export const isFirebaseInitialized = () => firebaseInitialized;

/**
 * Wraps a Firestore promise with a timeout to prevent indefinite hangs
 * when Firebase retries quota-exhausted requests (which can take 40-60 seconds).
 * 
 * Usage: const result = await withTimeout(db.collection('products').get());
 */
export function withTimeout<T>(promise: Promise<T>, ms = 120000): Promise<T> {
    const timeout = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Firebase operation timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}
