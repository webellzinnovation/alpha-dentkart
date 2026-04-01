import { Request, Response } from 'express';
import { db } from '../config/firebase';
import logger from '../utils/logger';

export const createSession = async (req: Request, res: Response) => {
    try {
        const { userId, isGuest, customerName, customerEmail } = req.body;

        const newSessionRef = db.collection('chat_sessions').doc();
        const sessionData = {
            id: newSessionRef.id,
            customerId: userId || null, // Keeping customerId for frontend compatibility
            customerName: customerName || 'Guest User',
            customerEmail: customerEmail || 'guest@example.com',
            isGuest: isGuest || true,
            status: 'ai', // 'ai' | 'admin' | 'closed'
            startedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            messages: []
        };

        await newSessionRef.set(sessionData);
        logger.info(`Created new chat session: ${sessionData.id}`);
        res.status(201).json(sessionData);
    } catch (error: any) {
        logger.error('Error creating chat session:', error);
        res.status(500).json({ error: 'Failed to create chat session' });
    }
};

export const getSession = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const sessionDoc = await db.collection('chat_sessions').doc(id).get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        res.json(sessionDoc.data());
    } catch (error: any) {
        logger.error(`Error fetching chat session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch chat session' });
    }
};

export const getAllSessions = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('chat_sessions')
            .orderBy('lastMessageAt', 'desc')
            .get();

        const sessions = snapshot.docs.map(doc => doc.data());
        res.json(sessions);
    } catch (error: any) {
        logger.error('Error fetching all chat sessions:', error);
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
};

export const addMessage = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const messageData = req.body; // Expects { text, sender ('user' | 'bot' | 'agent'), isRead }

        const sessionRef = db.collection('chat_sessions').doc(id);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        const newMessage = {
            id: Date.now().toString(),
            text: messageData.text,
            role: messageData.sender, // frontend expects 'role' = 'user' | 'model' | 'admin'
            senderName: messageData.senderName || (messageData.sender === 'user' ? 'Customer' : 'System'),
            timestamp: new Date().toISOString(),
            isRead: messageData.isRead || false
        };

        const sessionData = sessionDoc.data();
        const updatedMessages = [...(sessionData?.messages || []), newMessage];

        // Increment unread count if it's from user/model and we are not an admin viewing it
        let unreadCount = sessionData?.unreadCount || 0;
        if (newMessage.role === 'user' || newMessage.role === 'model') {
            unreadCount += 1;
        }

        // if explicitly marking read, maybe reset it (handled outside for now)

        await sessionRef.update({
            messages: updatedMessages,
            lastMessageAt: new Date().toISOString(),
            unreadCount
        });

        res.status(201).json(newMessage);
    } catch (error: any) {
        logger.error(`Error adding message to session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to add message' });
    }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, adminName, unreadCount } = req.body; // 'ai' | 'admin' | 'closed'

        const sessionRef = db.collection('chat_sessions').doc(id);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        const updates: any = {
            lastMessageAt: new Date().toISOString()
        };

        if (status !== undefined) updates.status = status;
        if (adminName !== undefined) updates.assignedAdmin = adminName;
        if (unreadCount !== undefined) updates.unreadCount = unreadCount;

        await sessionRef.update(updates);

        res.json({ success: true, status });
    } catch (error: any) {
        logger.error(`Error updating status for session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update session status' });
    }
};
