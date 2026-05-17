import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db, withTimeout } from '../config/firebase'; // Firestore
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import logger from '../utils/logger';
import { emailService } from '../services/EmailService';

export async function register(req: Request, res: Response) {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);
        const { email, password, name, phone, userType, ...extraFields } = validatedData;

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
            userType,
            role,
            ...extraFields,
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

        // Set HTTP-only cookie
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('__session', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        // Trigger email verification and welcome email asynchronously
        generateAndStoreVerificationToken(docRef.id, email, name).catch((err) => {
            logger.error('Failed to generate verification token', { error: err, userId: docRef.id });
        });

        emailService.sendWelcomeEmail(email, name).catch((err) => {
            logger.error('Failed to send welcome email', { error: err, userId: docRef.id });
        });

        // Return user data
        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            message: 'Registration successful. Please check your email to verify your account.',
        });
    } catch (error: any) {
        logger.error('Register error', { error, email: req.body?.email });
        const status = error.message?.includes('timed out') ? 504 : 500;
        return res.status(status).json({ error: error.message || 'Internal server error' });
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
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('__session', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        // Return user data
        return res.json({
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
        return res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('__session');
    return res.json({ message: 'Logged out successfully' });
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const { email } = validatedData;

        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            // For security reasons, don't reveal that the user doesn't exist
            return res.json({ message: 'If an account exists with this email, you will receive reset instructions.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        await db.collection('password_resets').doc(token).set({
            userId: userDoc.id,
            email,
            token,
            expiresAt,
            used: false,
            createdAt: new Date().toISOString(),
        });

        await emailService.sendPasswordResetEmail(email, token, userData.name);

        return res.json({ message: 'If an account exists with this email, you will receive reset instructions.' });
    } catch (error) {
        logger.error('ForgotPassword error', { error, email: req.body?.email });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        const { userId, password } = validatedData;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('users').doc(userId).update({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
            mustResetPassword: false
        });

        logger.info('Password reset successfully', { userId });

        return res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Password reset error', { error });
        return res.status(500).json({ error: 'Failed to reset password' });
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

        return res.json({ user });
    } catch (error: any) {
        logger.error('Me endpoint error', { error, userId: req.user?.id });
        const status = error.message?.includes('timed out') ? 504 : 500;
        return res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function updateProfile(req: any, res: Response) {
    try {
        const userId = req.user?.id;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Restricted fields that should not be updated via this endpoint
        const restrictedFields = ['email', 'password', 'role', 'isVerified', 'verifiedAt', 'createdAt'];
        restrictedFields.forEach(field => delete updates[field]);

        updates.updatedAt = new Date().toISOString();

        await userRef.update(updates);

        logger.info('User profile updated', { userId });

        return res.json({ message: 'Profile updated successfully' });
    } catch (error: any) {
        logger.error('UpdateProfile error', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to update profile' });
    }
}

// ==========================================
// Email Verification Functions
// ==========================================

async function generateAndStoreVerificationToken(userId: string, email: string, name: string): Promise<string> {
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

    // Send the email
    try {
        await emailService.sendVerificationEmail(email, token, name);
    } catch (err) {
        logger.error('Failed to send verification email', { userId, email, error: err });
    }

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

        return res.json({ message: 'Email verified successfully! You can now access all features.' });
    } catch (error) {
        logger.error('Email verification error', { error });
        return res.status(500).json({ error: 'Internal server error' });
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
        await generateAndStoreVerificationToken(userId, userData.email, userData.name);

        logger.info('Verification email resent', { userId, email: userData.email });

        return res.json({ message: 'Verification email has been resent. Please check your inbox.' });
    } catch (error) {
        logger.error('Resend verification error', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Internal server error' });
    }
}


