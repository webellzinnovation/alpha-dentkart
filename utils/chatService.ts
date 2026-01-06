// Chat Service - Manages customer chat sessions and admin handoff

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'admin';
    text: string;
    timestamp: Date;
    senderName?: string;
}

export interface ChatSession {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    messages: ChatMessage[];
    status: 'ai' | 'admin' | 'closed';
    startedAt: Date;
    lastMessageAt: Date;
    assignedAdmin?: string;
    unreadCount?: number;
}

const STORAGE_KEY = 'chatSessions';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get all chat sessions
export const getChatSessions = (): ChatSession[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        const sessions = JSON.parse(data);
        // Convert date strings back to Date objects
        return sessions.map((s: any) => ({
            ...s,
            startedAt: new Date(s.startedAt),
            lastMessageAt: new Date(s.lastMessageAt),
            messages: s.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }))
        }));
    } catch (error) {
        console.error('Error loading chat sessions:', error);
        return [];
    }
};

// Save all sessions
const saveSessions = (sessions: ChatSession[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error('Error saving chat sessions:', error);
    }
};

// Get or create chat session for a customer
export const getOrCreateSession = (customerId: string, customerName: string, customerEmail: string): ChatSession => {
    const sessions = getChatSessions();

    // Find existing active session for this customer
    let session = sessions.find(s => s.customerId === customerId && s.status !== 'closed');

    if (!session) {
        // Create new session
        session = {
            id: generateId(),
            customerId,
            customerName,
            customerEmail,
            messages: [],
            status: 'ai',
            startedAt: new Date(),
            lastMessageAt: new Date(),
            unreadCount: 0
        };
        sessions.push(session);
        saveSessions(sessions);
    }

    return session;
};

// Save a new message to a session
export const saveChatMessage = (
    sessionId: string,
    role: 'user' | 'model' | 'admin',
    text: string,
    senderName?: string
): void => {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const message: ChatMessage = {
        id: generateId(),
        role,
        text,
        timestamp: new Date(),
        senderName
    };

    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].lastMessageAt = new Date();

    // Increment unread count if message is from user or AI (not admin viewing)
    if (role === 'user' || role === 'model') {
        sessions[sessionIndex].unreadCount = (sessions[sessionIndex].unreadCount || 0) + 1;
    }

    saveSessions(sessions);
};

// Get specific chat session by ID
export const getChatById = (sessionId: string): ChatSession | null => {
    const sessions = getChatSessions();
    return sessions.find(s => s.id === sessionId) || null;
};

// Update chat status (ai -> admin, admin -> closed, etc.)
export const updateChatStatus = (sessionId: string, status: 'ai' | 'admin' | 'closed', adminName?: string): void => {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    sessions[sessionIndex].status = status;
    if (status === 'admin' && adminName) {
        sessions[sessionIndex].assignedAdmin = adminName;
    }

    saveSessions(sessions);
};

// Mark session as read (reset unread count)
export const markSessionAsRead = (sessionId: string): void => {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    sessions[sessionIndex].unreadCount = 0;
    saveSessions(sessions);
};

// Get active sessions count
export const getActiveSessionsCount = (): number => {
    const sessions = getChatSessions();
    return sessions.filter(s => s.status === 'ai' || s.status === 'admin').length;
};

// Get unread messages count across all sessions
export const getTotalUnreadCount = (): number => {
    const sessions = getChatSessions();
    return sessions.reduce((total, s) => total + (s.unreadCount || 0), 0);
};
