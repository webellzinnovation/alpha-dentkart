import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFy2DGglmiiWa3PKBN01nmfW--xasCtr8",
    authDomain: "alphadentkart-001.firebaseapp.com",
    projectId: "alphadentkart-001",
    storageBucket: "alphadentkart-001.firebasestorage.app",
    messagingSenderId: "388315003341",
    appId: "1:388315003341:web:42c8b5c98ef77552b7ac84",
    measurementId: "G-BHXYMK75W7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
