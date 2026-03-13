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
 * Test script to directly test auth login via Firestore.
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const firebase_1 = require("../config/firebase");
async function testLogin() {
    const email = 'admin@alphadentkart.com';
    const password = 'Admin@123456';
    console.log('🔍 Looking up user:', email);
    try {
        const usersRef = firebase_1.db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            console.log('❌ User not found in Firestore');
            process.exit(1);
        }
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() };
        console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, hasPassword: !!user.password });
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        console.log('🔑 Password valid:', validPassword);
        if (!validPassword) {
            console.log('❌ Password mismatch');
        }
        else {
            console.log('✅ Login would succeed! Role:', user.role);
        }
    }
    catch (err) {
        console.error('❌ Error:', err.message || err);
        console.error('Stack:', err.stack);
    }
    process.exit(0);
}
testLogin();
//# sourceMappingURL=testLogin.js.map