import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '../config/firebase'; // Firestore
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
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (!snapshot.empty) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            email,
            password: hashedPassword,
            name,
            phone,
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: false
        };

        const docRef = await usersRef.add(newUser);
        const user = { id: docRef.id, ...newUser };

        // Generate JWT
        const token = generateToken({
            id: user.id,
            role: user.role,
            email: user.email,
        });

        // Set HTTP-only cookie
        res.cookie('token', token, {
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
    } catch (error) {
        logger.error('Register error', { error, email: req.body?.email });
        res.status(500).json({ error: 'Internal server error' });
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

        // Set HTTP-only cookie
        res.cookie('token', token, {
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
    } catch (error) {
        logger.error('Login error', { error, email: req.body?.email });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
}

export async function me(req: any, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const docSnapshot = await db.collection('users').doc(userId).get();

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
            addresses: userData?.addresses || [],
            isVerified: userData?.isVerified ?? false,
        };

        res.json({ user });
    } catch (error) {
        logger.error('Me endpoint error', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateProfile(req: any, res: Response) {
    try {
        const userId = req.user?.id;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Only allow updating specific fields
        const allowedUpdates = ['name', 'phone', 'avatar', 'addresses'];
        const sanitizedUpdates: any = {};
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field];
            }
        });

        sanitizedUpdates.updatedAt = new Date().toISOString();

        await db.collection('users').doc(userId).update(sanitizedUpdates);

        // Fetch and return the updated user
        const docSnapshot = await db.collection('users').doc(userId).get();
        const userData = docSnapshot.data();

        const user = {
            id: docSnapshot.id,
            email: userData?.email,
            name: userData?.name,
            role: userData?.role,
            phone: userData?.phone,
            avatar: userData?.avatar,
            addresses: userData?.addresses || [],
            isVerified: userData?.isVerified ?? false,
        };

        logger.info('User profile updated', { userId });
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        logger.error('Update profile error', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Internal server error' });
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

