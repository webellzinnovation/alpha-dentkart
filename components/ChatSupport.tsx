import React, { useState, useEffect, useRef } from 'react';
import { getChatSessions, getChatById, updateChatStatus, saveChatMessage, markSessionAsRead, ChatSession } from '../utils/chatService';

export const ChatSupport: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'ai' | 'admin' | 'closed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load sessions
    const loadSessions = () => {
        const allSessions = getChatSessions();
        setSessions(allSessions);

        // Refresh selected session if viewing one
        if (selectedSession) {
            const updated = getChatById(selectedSession.id);
            if (updated) {
                setSelectedSession(updated);
            }
        }
    };

    useEffect(() => {
        loadSessions();
        // Refresh every 3 seconds for near real-time updates
        const interval = setInterval(loadSessions, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedSession?.messages]);

    // Filter sessions
    const filteredSessions = sessions.filter(s => {
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    // Handle session selection
    const handleSelectSession = (session: ChatSession) => {
        setSelectedSession(session);
        markSessionAsRead(session.id);
        loadSessions(); // Refresh to update unread count
    };

    // Handle take over
    const handleTakeOver = () => {
        if (!selectedSession) return;
        updateChatStatus(selectedSession.id, 'admin', 'Admin');

        // Add system message
        saveChatMessage(
            selectedSession.id,
            'admin',
            '🔄 Support team has joined the conversation',
            'System'
        );

        loadSessions();
    };

    // Handle send admin message
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessage.trim() || !selectedSession) return;

        saveChatMessage(
            selectedSession.id,
            'admin',
            adminMessage,
            'Support Team'
        );

        setAdminMessage('');
        loadSessions();
    };

    // Handle close chat
    const handleCloseChat = () => {
        if (!selectedSession) return;
        updateChatStatus(selectedSession.id, 'closed');

        saveChatMessage(
            selectedSession.id,
            'admin',
            '✅ Chat closed. Thank you for contacting us!',
            'System'
        );

        setSelectedSession(null);
        loadSessions();
    };

    // Format timestamp
    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            ai: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            admin: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
        return badges[status as keyof typeof badges] || badges.ai;
    };

    return (
        <div className="h-[calc(100vh-200px)] flex gap-4">
            {/* Chat List */}
            <div className="w-1/3 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Customer Chats</h2>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm mb-3"
                    />

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {(['all', 'ai', 'admin', 'closed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterStatus === status
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredSessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <i className="fas fa-comments text-4xl mb-2"></i>
                            <p>No chats found</p>
                        </div>
                    ) : (
                        filteredSessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => handleSelectSession(session)}
                                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-primary' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">{session.customerName}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(session.lastMessageAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{session.customerEmail}</p>
                                <div className="flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(session.status)}`}>
                                        {session.status === 'ai' ? '🤖 AI' : session.status === 'admin' ? '👤 Admin' : '✅ Closed'}
                                    </span>
                                    {(session.unreadCount || 0) > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            {session.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Detail */}
            <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                {selectedSession ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{selectedSession.customerName}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSession.customerEmail}</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedSession.status === 'ai' && (
                                    <button
                                        onClick={handleTakeOver}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm flex items-center gap-2"
                                    >
                                        <i className="fas fa-hand-paper"></i>
                                        Take Over
                                    </button>
                                )}
                                {selectedSession.status !== 'closed' && (
                                    <button
                                        onClick={handleCloseChat}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold text-sm flex items-center gap-2"
                                    >
                                        <i className="fas fa-check"></i>
                                        Close Chat
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedSession.messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${msg.role === 'user'
                                            ? 'bg-primary text-white'
                                            : msg.role === 'admin'
                                                ? 'bg-green-100 dark:bg-green-900 text-gray-800 dark:text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                                        } rounded-lg p-3`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-xs mt-1 opacity-70">
                                            {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input (only if admin or admin has taken over) */}
                        {selectedSession.status !== 'closed' && selectedSession.status === 'admin' && (
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={adminMessage}
                                        onChange={(e) => setAdminMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!adminMessage.trim()}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <i className="fas fa-comments text-6xl mb-4"></i>
                            <p className="text-lg">Select a chat to view conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
