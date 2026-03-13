import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db, withTimeout } from '../config/firebase'; // Firestore
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validation';
import logger from '../utils/logger';

export async function register(req: Request, res: Response) {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);
        const { email, password, name, phone } = validatedData;

        // Check if user already exists
        const usersRef = db.collection('users');
        const snapshot = await withTimeout(usersRef.where('email', '==', email).limit(1).get());

        if (!snapshot.empty) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role - allow admin registration only with valid server-side secret key
        const ADMIN_SECRET = process.env.ADMIN_SECRET;
        const isAdminKeyProvided = req.body.adminKey && ADMIN_SECRET && req.body.adminKey === ADMIN_SECRET;
        const role = isAdminKeyProvided ? 'admin' : 'user';

        // Create user
        const newUser = {
            email,
            password: hashedPassword,
            name,
            phone,
            role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: role === 'admin' // Auto-verify admins
        };

        const docRef = await withTimeout(usersRef.add(newUser));
        const user = { id: docRef.id, ...newUser };

        // Generate JWT
        const token = generateToken({
            id: user.id,
            role: user.role,
            email: user.email,
        });

        // Set HTTP-only cookie using __session to prevent Firebase Hosting from stripping it
        res.cookie('__session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return user data (without password)
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            message: 'Registration successful. Please check your email to verify your account.',
        });

        // Trigger email verification asynchronously (don't block response)
        generateAndStoreVerificationToken(docRef.id, email).catch((err) => {
            logger.error('Failed to generate verification token after registration', { error: err, userId: docRef.id });
        });
    } catch (error: any) {
        logger.error('Register error', { error, email: req.body?.email });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function login(req: Request, res: Response) {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;

        // Find user
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() } as any;

        // Check if user has password (WordPress imported users may not have password)
        if (!user.password) {
            return res.status(401).json({
                error: 'password_reset_required',
                message: 'Your account needs password setup. Please reset your password.',
                userId: user.id
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = generateToken({
            id: user.id,
            role: user.role,
            email: user.email,
        });

        // Set HTTP-only cookie using __session to prevent Firebase Hosting from stripping it
        res.cookie('__session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Return user data
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                isVerified: user.isVerified ?? false,
            },
        });
    } catch (error: any) {
        logger.error('Login error', { error, email: req.body?.email });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('__session');
    res.json({ message: 'Logged out successfully' });
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ error: 'User ID and new password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('users').doc(userId).update({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
            mustResetPassword: false
        });

        logger.info('Password reset successfully', { userId });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Password reset error', { error });
        res.status(500).json({ error: 'Failed to reset password' });
    }
}

export async function me(req: any, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const docSnapshot = await withTimeout(db.collection('users').doc(userId).get());

        if (!docSnapshot.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = docSnapshot.data();

        // Construct safe user object (exclude sensitive fields)
        const user = {
            id: docSnapshot.id,
            email: userData?.email,
            name: userData?.name,
            role: userData?.role,
            phone: userData?.phone,
            avatar: userData?.avatar,
            isVerified: userData?.isVerified ?? false,
        };

        res.json({ user });
    } catch (error: any) {
        logger.error('Me endpoint error', { error, userId: req.user?.id });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

// ==========================================
// Email Verification Functions
// ==========================================

async function generateAndStoreVerificationToken(userId: string, email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.collection('email_verifications').doc(token).set({
        userId,
        email,
        token,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
    });

    // Log the verification link (replace with actual email sending in production)
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    logger.info('Verification email generated', { userId, email, verificationLink });

    return token;
}

export async function verifyEmail(req: Request, res: Response) {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Look up the token
        const verificationDoc = await db.collection('email_verifications').doc(token).get();

        if (!verificationDoc.exists) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const verification = verificationDoc.data()!;

        // Check if already used
        if (verification.used) {
            return res.status(400).json({ error: 'Token has already been used' });
        }

        // Check expiration
        if (new Date(verification.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        }

        // Update user's isVerified status
        await db.collection('users').doc(verification.userId).update({
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Mark token as used
        await db.collection('email_verifications').doc(token).update({
            used: true,
            usedAt: new Date().toISOString(),
        });

        logger.info('Email verified successfully', { userId: verification.userId, email: verification.email });

        res.json({ message: 'Email verified successfully! You can now access all features.' });
    } catch (error) {
        logger.error('Email verification error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function resendVerification(req: any, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data()!;

        if (userData.isVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Invalidate old tokens
        const oldTokens = await db.collection('email_verifications')
            .where('userId', '==', userId)
            .where('used', '==', false)
            .get();

        const batch = db.batch();
        oldTokens.docs.forEach((doc) => {
            batch.update(doc.ref, { used: true, invalidatedAt: new Date().toISOString() });
        });
        await batch.commit();

        // Generate new token
        await generateAndStoreVerificationToken(userId, userData.email);

        logger.info('Verification email resent', { userId, email: userData.email });

        res.json({ message: 'Verification email has been resent. Please check your inbox.' });
    } catch (error) {
        logger.error('Resend verification error', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAllUsers(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const role = req.query.role as string;

        let query: FirebaseFirestore.Query = db.collection('users');

        const snapshot = await query.get();
        let allUsers: any[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const { password, ...userWithoutPassword } = data;
            return {
                id: doc.id,
                ...userWithoutPassword,
                orders: []
            };
        });

        // Sort in memory to include users missing createdAt
        allUsers.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.registrationDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.registrationDate || 0).getTime();
            return dateB - dateA;
        });

        if (search) {
            const s = search.toLowerCase();
            allUsers = allUsers.filter(u =>
                (u.name && u.name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s)) ||
                (u.phone && String(u.phone).includes(s))
            );
        }

        const total = allUsers.length;
        const startIndex = (page - 1) * limit;
        const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);

        res.json({
            users: paginatedUsers,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error while fetching users' });
    }
}

