"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionStatus = exports.addMessage = exports.getAllSessions = exports.getSession = exports.createSession = void 0;
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const createSession = async (req, res) => {
    try {
        const { userId, isGuest, customerName, customerEmail } = req.body;
        const newSessionRef = firebase_1.db.collection('chat_sessions').doc();
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
        logger_1.default.info(`Created new chat session: ${sessionData.id}`);
        res.status(201).json(sessionData);
    }
    catch (error) {
        logger_1.default.error('Error creating chat session:', error);
        res.status(500).json({ error: 'Failed to create chat session' });
    }
};
exports.createSession = createSession;
const getSession = async (req, res) => {
    try {
        const id = req.params.id;
        const sessionDoc = await firebase_1.db.collection('chat_sessions').doc(id).get();
        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        res.json(sessionDoc.data());
    }
    catch (error) {
        logger_1.default.error(`Error fetching chat session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch chat session' });
    }
};
exports.getSession = getSession;
const getAllSessions = async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('chat_sessions')
            .orderBy('lastMessageAt', 'desc')
            .get();
        const sessions = snapshot.docs.map(doc => doc.data());
        res.json(sessions);
    }
    catch (error) {
        logger_1.default.error('Error fetching all chat sessions:', error);
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
};
exports.getAllSessions = getAllSessions;
const addMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const messageData = req.body; // Expects { text, sender ('user' | 'bot' | 'agent'), isRead }
        const sessionRef = firebase_1.db.collection('chat_sessions').doc(id);
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
    }
    catch (error) {
        logger_1.default.error(`Error adding message to session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to add message' });
    }
};
exports.addMessage = addMessage;
const updateSessionStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, adminName, unreadCount } = req.body; // 'ai' | 'admin' | 'closed'
        const sessionRef = firebase_1.db.collection('chat_sessions').doc(id);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        const updates = {
            lastMessageAt: new Date().toISOString()
        };
        if (status !== undefined)
            updates.status = status;
        if (adminName !== undefined)
            updates.assignedAdmin = adminName;
        if (unreadCount !== undefined)
            updates.unreadCount = unreadCount;
        await sessionRef.update(updates);
        res.json({ success: true, status });
    }
    catch (error) {
        logger_1.default.error(`Error updating status for session ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update session status' });
    }
};
exports.updateSessionStatus = updateSessionStatus;
//# sourceMappingURL=chatSessionController.js.map