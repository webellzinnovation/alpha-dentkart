import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let firebaseInitialized = false;

try {
    // Check if already initialized
    if (admin.apps.length === 0) {
        // Priority 1: Environment Variable (Vercel Production)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Admin initialized from Environment Variable');
            firebaseInitialized = true;
        }
        // Priority 2: Local File (Development)
        else {
            const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin initialized from Local File');
                firebaseInitialized = true;
            } else {
                console.warn('⚠️ No Firebase Service Account found. Database calls will fail.');
                console.warn('   Place firebase-service-account.json in project root, or set FIREBASE_SERVICE_ACCOUNT env var.');
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

export const isFirebaseInitialized = firebaseInitialized;

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase operation timed out')), ms)
    );
    return Promise.race([promise, timeout]);
}
