"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const categories_1 = __importDefault(require("./routes/categories"));
const brands_1 = __importDefault(require("./routes/brands"));
const orders_1 = __importDefault(require("./routes/orders"));
const ai_1 = __importDefault(require("./routes/ai"));
const chatSessionRoutes_1 = __importDefault(require("./routes/chatSessionRoutes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const heroSlides_1 = __importDefault(require("./routes/heroSlides"));
const promotionalTiles_1 = __importDefault(require("./routes/promotionalTiles"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const shipping_1 = __importDefault(require("./routes/shipping"));
const shiprocket_1 = __importDefault(require("./routes/shiprocket"));
const guestCheckout_1 = __importDefault(require("./routes/guestCheckout"));
const coupon_1 = __importDefault(require("./routes/coupon"));
const orderCancellation_1 = __importDefault(require("./routes/orderCancellation"));
const verification_1 = __importDefault(require("./routes/verification"));
const savedPayment_1 = __importDefault(require("./routes/savedPayment"));
const quickReorder_1 = __importDefault(require("./routes/quickReorder"));
const deliveryEstimation_1 = __importDefault(require("./routes/deliveryEstimation"));
const returns_1 = __importDefault(require("./routes/returns"));
const adminStats_1 = __importDefault(require("./routes/adminStats"));
const settings_1 = __importDefault(require("./routes/settings"));
const users_1 = __importDefault(require("./routes/users"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
// import { authLimiter } from '../middleware/rateLimiter'; // specific one
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const sanitize_1 = require("./middleware/sanitize");
const requestLogger_1 = require("./middleware/requestLogger");
const auditLogger_1 = require("./middleware/auditLogger");
const logger_1 = __importDefault(require("./utils/logger"));
const errorTracker_1 = require("./utils/errorTracker");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// ====================================================
// STARTUP VALIDATION — Crash fast if required env vars are missing
// ====================================================
const REQUIRED_ENV_VARS = [
    'JWT_SECRET',
    'ADMIN_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
];
const MISSING_VARS = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
// Specialized check for Firebase — allow environment variable, local file, OR native Functions environment
const hasFirebaseEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT;
const hasFirebaseFile = fs_1.default.existsSync(path_1.default.join(process.cwd(), 'firebase-service-account.json')) || fs_1.default.existsSync(path_1.default.join(process.cwd(), '..', 'firebase-service-account.json'));
const isFunctionsEnv = !!(process.env.FUNCTIONS_EMULATOR || process.env.FUNCTION_NAME || process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG || process.env.FIREBASE_DEPLOY_TOOL);
const isFirebaseMissing = !hasFirebaseEnv && !hasFirebaseFile && !isFunctionsEnv;
if (MISSING_VARS.length > 0) {
    // In strict production, we'd crash. But in Firebase Functions, some secrets are mounted later.
    // For now, only log warnings if running in Functions environments to prevent cold start crashes.
    if (!isFunctionsEnv) {
        console.error(`❌ FATAL: Missing required configuration: ${MISSING_VARS.join(', ')}`);
        process.exit(1);
    }
    else {
        console.warn(`⚠️ WARNING: Missing configuration in Functions: ${MISSING_VARS.join(', ')}`);
    }
}
if (isFirebaseMissing) {
    console.error(`❌ FATAL: Missing Firebase credentials. (Not in Functions, no ENV, no file)`);
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
// Trust the first proxy (Firebase Hosting / Vercel Load Balancers)
// This is REQUIRED for express-rate-limit to correctly identify client IPs
// and prevent ERR_ERL_UNEXPECTED_X_FORWARDED_FOR crashes.
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
const ALLOWED_ORIGINS = [
    CLIENT_URL,
    'capacitor://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://alphadentkart.com',
    'https://www.alphadentkart.com',
    'https://alphadentkart-001.web.app',
    'https://alphadentkart-001.firebaseapp.com'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin)
            return callback(null, true);
        const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.web.app') ||
            origin.endsWith('.firebaseapp.com') ||
            origin.includes('alphadentkart');
        if (isAllowed) {
            callback(null, true);
        }
        else {
            logger_1.default.warn('CORS blocked origin:', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
app.use(sanitize_1.sanitizeInput);
app.use(requestLogger_1.requestLogger);
// Initialize error tracker
errorTracker_1.errorTracker.init();
// Apply rate limiting to all API routes
app.use('/api', rateLimiter_1.apiLimiter);
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Alpha Dentkart API',
        version: 'v1',
        health: '/health',
        docs: '/api/docs'
    });
});
// Health check
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
    res.json({
        status: 'ok',
        message: 'Secure backend is running',
        environment: process.env.NODE_ENV,
        database: 'Firebase Firestore',
        apiVersion: 'v1',
    });
});
// Audit logger for all API write operations
app.use('/api', auditLogger_1.auditLogger);
// API v1 Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/categories', categories_1.default);
app.use('/api/v1/brands', brands_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/custom-notifications', notifications_1.default);
app.use('/api/v1/chat-sessions', chatSessionRoutes_1.default);
app.use('/api/v1/orders', orders_1.default);
app.use('/api/v1/ai', ai_1.default);
app.use('/api/v1/hero-slides', heroSlides_1.default);
app.use('/api/v1/promotional-tiles', promotionalTiles_1.default);
app.use('/api/v1/reviews', reviews_1.default);
app.use('/api/v1/shipping', shipping_1.default);
app.use('/api/v1/shiprocket', shiprocket_1.default);
app.use('/api/v1/guest', guestCheckout_1.default);
app.use('/api/v1/coupons', coupon_1.default);
app.use('/api/v1/order-cancellation', orderCancellation_1.default);
app.use('/api/v1/verification', verification_1.default);
app.use('/api/v1/saved-payments', savedPayment_1.default);
app.use('/api/v1/quick-reorder', quickReorder_1.default);
app.use('/api/v1/delivery-estimation', deliveryEstimation_1.default);
app.use('/api/v1/returns', returns_1.default);
app.use('/api/v1/admin/stats', adminStats_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/whatsapp', whatsapp_1.default);
// Backward-compatible redirect: /api/* → /api/v1/*
// This ensures existing frontend code continues to work
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/v1/')) {
        const newUrl = req.originalUrl.replace('/api/', '/api/v1/');
        return res.redirect(307, newUrl);
    }
    next();
});
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Notice: Firebase Functions (using onRequest) automatically binds the Express app to a port.
// Therefore, we must NOT call app.listen() here.
exports.default = app;
//# sourceMappingURL=server.js.map