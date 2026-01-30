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
import shippingRoutes from './routes/shipping';
import shiprocketRoutes from './routes/shiprocket';
import guestCheckoutRoutes from './routes/guestCheckout';
import couponRoutes from './routes/coupon';
import orderCancellationRoutes from './routes/orderCancellation';
import verificationRoutes from './routes/verification';
import savedPaymentRoutes from './routes/savedPayment';
import quickReorderRoutes from './routes/quickReorder';
import deliveryEstimationRoutes from './routes/deliveryEstimation';
import { authLimiter } from '../middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Initialize Firebase Admin (only if service account exists)
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
} else {
    console.warn('Firebase Service Account not found. Push notifications will be disabled.');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Tailwind CDN for now
}));

const ALLOWED_ORIGINS = [CLIENT_URL, 'capacitor://localhost', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
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

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Secure backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/promotional-tiles', promotionalTileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api/guest', guestCheckoutRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/order-cancellation', orderCancellationRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/saved-payments', savedPaymentRoutes);
app.use('/api/quick-reorder', quickReorderRoutes);
app.use('/api/delivery-estimation', deliveryEstimationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`\n🔒 Secure Backend Server Running`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Client URL: ${CLIENT_URL}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n🛡️  Security Features Enabled:`);
    console.log(`   ✓ JWT Authentication`);
    console.log(`   ✓ Password Hashing (bcrypt)`);
    console.log(`   ✓ Rate Limiting`);
    console.log(`   ✓ CORS Protection`);
    console.log(`   ✓ Helmet Security Headers`);
    console.log(`   ✓ HTTP-only Cookies`);
    console.log(`\n📚 API Endpoints:`);
    console.log(`   POST   /api/auth/register`);
    console.log(`   POST   /api/auth/login`);
    console.log(`   POST   /api/auth/logout`);
    console.log(`   GET    /api/auth/me`);
    console.log(`   GET    /api/products`);
    console.log(`   GET    /api/products/:id`);
    console.log(`   POST   /api/orders`);
    console.log(`   GET    /api/orders/me`);
    console.log(`   POST   /api/ai/chat`);
    console.log(`   GET    /api/reviews/products/:id`);
    console.log(`   POST   /api/reviews`);
    console.log(`   GET    /api/reviews/me`);
    console.log(`   PUT    /api/reviews/:id`);
    console.log(`   DELETE /api/reviews/:id`);
    console.log(`   POST   /api/shipping/create`);
    console.log(`   GET    /api/shipping/track/:trackingId`);
    console.log(`   POST   /api/shipping/rates`);
    console.log(`   GET    /api/shipping/pincode/:pincode`);
    console.log(`   GET    /api/shipping/order/:orderId`);
    console.log(`   POST   /api/shiprocket/check-pincode`);
    console.log(`   POST   /api/shiprocket/get-rates`);
    console.log(`   POST   /api/shiprocket/estimate-delivery`);
    console.log(`   POST   /api/shiprocket/calculate-charges`);
    console.log(`   POST   /api/shiprocket/create-order`);
    console.log(`   POST   /api/shiprocket/track`);
    console.log(`   POST   /api/shiprocket/track-order`);
    console.log(`   POST   /api/shiprocket/cancel`);
    console.log(`   POST   /api/shiprocket/available-couriers`);
    console.log(`   POST   /api/coupons`);
    console.log(`   GET    /api/coupons`);
    console.log(`   GET    /api/coupons/analytics`);
    console.log(`   GET    /api/coupons/:id`);
    console.log(`   PUT    /api/coupons/:id`);
    console.log(`   DELETE /api/coupons/:id`);
    console.log(`   POST   /api/coupons/validate`);
    console.log(`   POST   /api/coupons/apply`);
    console.log(`   POST   /api/guest/session/create`);
    console.log(`   GET    /api/guest/session/validate/:sessionId`);
    console.log(`   POST   /api/guest/order/create`);
    console.log(`   GET    /api/guest/order/:orderId`);
    console.log(`   PUT    /api/guest/order/:orderId`);
    console.log(`   GET    /api/guest/order/:orderId/status`);
    console.log(`   GET    /api/guest/session/:sessionId/orders`);
    console.log(`   POST   /api/guest/order/:orderId/convert`);
    console.log(`\n`);
});

export default app;
