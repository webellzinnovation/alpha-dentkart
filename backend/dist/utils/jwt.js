"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
function getJwtSecret() {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is REQUIRED in production. Set a secure random string (min 32 chars).');
    }
    const devSecretFile = '.jwt_secret_dev';
    const fs = require('fs');
    const path = require('path');
    const secretPath = path.join(process.cwd(), devSecretFile);
    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
    }
    const devSecret = crypto_1.default.randomBytes(64).toString('hex');
    fs.writeFileSync(secretPath, devSecret);
    console.log('⚠️  Auto-generated dev JWT secret saved to .jwt_secret_dev');
    return devSecret;
}
const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
//# sourceMappingURL=jwt.js.map