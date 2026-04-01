import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * Register push notification token for authenticated user
 */
export async function registerPushToken(req: AuthRequest, res: Response) {
  try {
    // User should be attached to req by authenticateToken middleware
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, platform } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web'];
    if (!platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Valid platform is required (ios, android, web)' });
    }

    // Store push token in Firestore
    const pushTokenRef = db.collection('pushTokens').doc();
    
    await pushTokenRef.set({
      userId: user.id, // Using the id property from AuthRequest interface
      token,
      platform,
      registeredAt: new Date().toISOString(),
      active: true
    });

    logger.info('Push token registered', {
      userId: user.id,
      platform,
      token: token.substring(0, 20) + '...' // Log partial token for security
    });

    res.status(201).json({
      success: true,
      message: 'Push notification token registered successfully',
      tokenId: pushTokenRef.id
    });
  } catch (error) {
    logger.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push notification token' });
  }
}

/**
 * Get all push tokens for authenticated user (for testing/admin)
 */
export async function getUserPushTokens(req: AuthRequest, res: Response) {
  try {
    // User should be attached to req by authenticateToken middleware
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id; // Using the id property from AuthRequest interface
    
    // Query push tokens for this user
    const pushTokensRef = db.collection('pushTokens');
    const snapshot = await pushTokensRef.where('userId', '==', userId).where('active', '==', true).get();
    
    const tokens = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      tokens,
      count: tokens.length
    });
  } catch (error) {
    logger.error('Error getting user push tokens:', error);
    res.status(500).json({ error: 'Failed to retrieve push notification tokens' });
  }
}