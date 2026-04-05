import admin from 'firebase-admin';
declare let db: admin.firestore.Firestore;
declare let auth: admin.auth.Auth;
export { admin, db, auth };
export declare const isFirebaseInitialized: boolean;
export declare function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>;
//# sourceMappingURL=firebase.d.ts.map