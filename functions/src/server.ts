import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import brandRoutes from './routes/brands';
import orderRoutes from './routes/orders';
import aiRoutes from './routes/ai';
import chatSessionRoutes from './routes/chatSessionRoutes';
import notificationRoutes from './routes/notification.routes';
import customNotificationRoutes from './routes/notifications';
import heroSlideRoutes from './routes/heroSlides';
import promotionalTileRoutes from './routes/promotionalTiles';
import reviewRoutes from './routes/reviews';
import shippingRoutes from './routes/shipping';
import shiprocketRoutes from './routes/shiprocket';
import guestCheckoutRoutes from './routes/guestCheckout';
import couponRoutes from './routes/coupon';
import orderCancellationRoutes from './routes/orderCancellation';
import verificationRoutes from './routes/verification';
import savedPaymentRoutes from './routes/savedPayment';
import quickReorderRoutes from './routes/quickReorder';
import deliveryEstimationRoutes from './routes/deliveryEstimation';
import returnRoutes from './routes/returns';
import adminStatsRoutes from './routes/adminStats';
import settingsRoutes from './routes/settings';
import userRoutes from './routes/users';
import whatsappRoutes from './routes/whatsapp';
// import { authLimiter } from '../middleware/rateLimiter'; // specific one
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import { requestLogger } from './middleware/requestLogger';
import { auditLogger } from './middleware/auditLogger';
import logger from './utils/logger';
import { errorTracker } from './utils/errorTracker';
import { db } from './config/firebase'; // Config
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

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
const hasFirebaseFile = fs.existsSync(path.join(process.cwd(), 'firebase-service-account.json')) || fs.existsSync(path.join(process.cwd(), '..', 'firebase-service-account.json'));
const isFunctionsEnv = !!(process.env.FUNCTIONS_EMULATOR || process.env.FUNCTION_NAME || process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG || process.env.FIREBASE_DEPLOY_TOOL);
const isFirebaseMissing = !hasFirebaseEnv && !hasFirebaseFile && !isFunctionsEnv;

if (MISSING_VARS.length > 0) {
    // In strict production, we'd crash. But in Firebase Functions, some secrets are mounted later.
    // For now, only log warnings if running in Functions environments to prevent cold start crashes.
    if (!isFunctionsEnv) {
        console.error(`❌ FATAL: Missing required configuration: ${MISSING_VARS.join(', ')}`);
        process.exit(1);
    } else {
        console.warn(`⚠️ WARNING: Missing configuration in Functions: ${MISSING_VARS.join(', ')}`);
    }
}

if (isFirebaseMissing) {
    console.error(`❌ FATAL: Missing Firebase credentials. (Not in Functions, no ENV, no file)`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Trust the first proxy (Firebase Hosting / Vercel Load Balancers)
// This is REQUIRED for express-rate-limit to correctly identify client IPs
// and prevent ERR_ERL_UNEXPECTED_X_FORWARDED_FOR crashes.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

const ALLOWED_ORIGINS = [
    CLIENT_URL,
    'capacitor://localhost',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009',
    'http://localhost:5173',
    'https://alphadentkart.com',
    'https://www.alphadentkart.com',
    'https://alphadentkart-001.web.app',
    'https://alphadentkart-001.firebaseapp.com'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);

        const isAllowed = 
            ALLOWED_ORIGINS.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            origin.endsWith('.web.app') || 
            origin.endsWith('.firebaseapp.com') ||
            origin.includes('alphadentkart');

        if (isAllowed) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin:', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(requestLogger);

// Initialize error tracker
errorTracker.init();

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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
app.use('/api', auditLogger);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/custom-notifications', customNotificationRoutes);
app.use('/api/v1/chat-sessions', chatSessionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/hero-slides', heroSlideRoutes);
app.use('/api/v1/promotional-tiles', promotionalTileRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/shiprocket', shiprocketRoutes);
app.use('/api/v1/guest', guestCheckoutRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/order-cancellation', orderCancellationRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/saved-payments', savedPaymentRoutes);
app.use('/api/v1/quick-reorder', quickReorderRoutes);
app.use('/api/v1/delivery-estimation', deliveryEstimationRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/admin/stats', adminStatsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

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
app.use(errorHandler);

// Notice: Firebase Functions (using onRequest) automatically binds the Express app to a port.
// Therefore, we must NOT call app.listen() here.

export default app;
