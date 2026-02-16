import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Privacy Policy</h1>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Last Updated: February 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Information We Collect</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    Alpha Dentkart collects the following information when you use our platform:
                </p>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li><strong>Account Information:</strong> Name, email address, phone number, and shipping address provided during registration.</li>
                    <li><strong>Order Information:</strong> Products purchased, payment method used, order history, and shipping details.</li>
                    <li><strong>Device Information:</strong> Browser type, IP address, and device identifiers for security and analytics.</li>
                    <li><strong>Usage Data:</strong> Pages visited, search queries, and interaction patterns to improve our services.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem' }}>
                    <li>Process and fulfill your orders, including shipping and payment processing.</li>
                    <li>Communicate with you about your orders, account, or customer support requests.</li>
                    <li>Improve our platform, products, and services.</li>
                    <li>Send promotional communications (only if you opt in).</li>
                    <li>Prevent fraud and ensure the security of our platform.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Data Sharing</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    We do not sell your personal data. We share information only with:
                </p>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li><strong>Payment Processors:</strong> Razorpay for payment processing.</li>
                    <li><strong>Shipping Partners:</strong> Shiprocket and courier services for order delivery.</li>
                    <li><strong>Cloud Services:</strong> Firebase (Google) for data storage and authentication.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Data Security</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    We implement industry-standard security measures including encrypted connections (HTTPS),
                    secure password hashing (bcrypt), HTTP-only authentication cookies, and rate limiting to
                    protect your data against unauthorized access.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Your Rights</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    Under Indian data protection laws (IT Act, 2000 and DPDP Act, 2023), you have the right to:
                </p>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li>Access, correct, or delete your personal data.</li>
                    <li>Withdraw consent for data processing.</li>
                    <li>Lodge a grievance with our Data Protection Officer.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Cookies</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    We use essential cookies for authentication and session management. We use analytics cookies
                    only with your consent. You can manage cookie preferences through our cookie consent banner.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Contact Us</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    For privacy-related inquiries, contact us at: <a href="mailto:sales@alphadentkart.com" style={{ color: '#2563eb' }}>sales@alphadentkart.com</a>
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
