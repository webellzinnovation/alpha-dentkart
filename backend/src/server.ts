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
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Tailwind CDN for now
}));

app.use(cors({
    origin: CLIENT_URL,
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
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);

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
    console.log(`\n`);
});

export default app;
