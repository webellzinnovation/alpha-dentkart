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
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const heroSlides_1 = __importDefault(require("./routes/heroSlides"));
const promotionalTiles_1 = __importDefault(require("./routes/promotionalTiles"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const settings_1 = __importDefault(require("./routes/settings"));
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
const chatSessionRoutes_1 = __importDefault(require("./routes/chatSessionRoutes"));
const users_1 = __importDefault(require("./routes/users"));
// import { authLimiter } from '../middleware/rateLimiter'; // specific one
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const sanitize_1 = require("./middleware/sanitize");
const requestLogger_1 = require("./middleware/requestLogger");
const auditLogger_1 = require("./middleware/auditLogger");
const csrf_1 = require("./middleware/csrf");
const logger_1 = __importDefault(require("./utils/logger"));
const errorTracker_1 = require("./utils/errorTracker");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
// Security middleware
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies
}));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(csrf_1.generateCsrfToken);
app.use(csrf_1.validateCsrfToken);
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
app.use('/api', auditLogger_1.auditLogger);
// API v1 Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/categories', categories_1.default);
app.use('/api/v1/brands', brands_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
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
app.use('/api/v1/admin-stats', adminStats_1.default);
app.use('/api/v1/chat-sessions', chatSessionRoutes_1.default);
app.use('/api/v1/users', users_1.default);
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
app.use(errorHandler_1.errorHandler);
// Start server if not running in Vercel (Local Development)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        logger_1.default.info('Server started', {
            port: PORT,
            clientUrl: CLIENT_URL,
            environment: process.env.NODE_ENV || 'development',
            database: 'Firebase Firestore',
        });
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map