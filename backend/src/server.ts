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
import notificationRoutes from './routes/notification.routes';
import heroSlideRoutes from './routes/heroSlides';
import promotionalTileRoutes from './routes/promotionalTiles';
import reviewRoutes from './routes/reviews';
import settingsRoutes from './routes/settings';
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
import chatSessionRoutes from './routes/chatSessionRoutes';
import userRoutes from './routes/users';
import invoiceRoutes from './routes/invoice';
import webhookRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';
import pushNotificationRoutes from './routes/pushNotifications';
import whatsappRoutes from './routes/whatsapp';
// import { authLimiter } from '../middleware/rateLimiter'; // specific one
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import { requestLogger } from './middleware/requestLogger';
import { auditLogger } from './middleware/auditLogger';
import { generateCsrfToken, validateCsrfToken } from './middleware/csrf';
import logger from './utils/logger';
import { errorTracker } from './utils/errorTracker';
import { db } from './config/firebase'; // Config
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Tailwind CDN for now
}));

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009',
    'https://alphadentkart.com',
    'https://www.alphadentkart.com',
    'http://192.168.1.14:3000',
    'http://192.168.1.14:3001',
    'http://192.168.1.14:3002',
    'http://192.168.1.14:3003',
    'http://192.168.1.14:3004'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generateCsrfToken);
// Skip CSRF validation in development for easier testing
if (process.env.NODE_ENV === 'production') {
    app.use(validateCsrfToken);
}
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
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Secure backend is running',
        environment: process.env.NODE_ENV,
        database: 'Firebase Firestore',
        apiVersion: 'v1',
    });
});

// CSRF token endpoint (expose token to frontend)
app.get('/api/v1/csrf-token', (req, res) => {
    const token = req.cookies['csrf-token'];
    res.json({ csrfToken: token || null });
});


// Audit logger for all API write operations
app.use('/api', auditLogger);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/notifications', notificationRoutes);
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
app.use('/api/v1/admin-stats', adminStatsRoutes);
app.use('/api/v1/chat-sessions', chatSessionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/invoice', invoiceRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/push-notifications', pushNotificationRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

// Backward-compatible redirect: /api/* → /api/v1/*
// This ensures existing frontend code continues to work
app.use('/api/:resource', (req, res, next) => {
    // Only redirect if not already a v1 route and resource exists
    const resource = req.params.resource;
    if (resource !== 'v1') {
        const newUrl = `/api/v1/${resource}${req.url === '/' ? '' : req.url}`;
        return res.redirect(307, newUrl);
    }
    next();
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server if not running in Vercel (Local Development)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        logger.info('Server started', {
            port: PORT,
            clientUrl: CLIENT_URL,
            environment: process.env.NODE_ENV || 'development',
            database: 'Firebase Firestore',
        });
    });
}

export default app;
