import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for alphadentkart-001
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyToPreventStartupCrash",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "alphadentkart-001.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "alphadentkart-001",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "alphadentkart-001.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
