import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('alpha_cookie_consent');
        if (!consent) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('alpha_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('alpha_cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.97)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap' as const,
            gap: '1rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            animation: 'slideUp 0.4s ease-out',
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '700px', margin: 0 }}>
                🍪 We use essential cookies for authentication and optional analytics cookies to improve your experience.
                By clicking "Accept", you consent to our use of cookies. Read our{' '}
                <a href="/privacy-policy" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                <button
                    onClick={handleDecline}
                    style={{
                        background: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #475569',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    Decline
                </button>
                <button
                    onClick={handleAccept}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    }}
                >
                    Accept
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
