import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Terms of Service</h1>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Last Updated: February 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    By accessing or using Alpha Dentkart ("the Platform"), you agree to be bound by these Terms
                    of Service. If you do not agree, please do not use the Platform. Alpha Dentkart is operated
                    by Webellz Innovation and is intended for dental professionals and authorized buyers in India.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Account Registration</h2>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem' }}>
                    <li>You must provide accurate and complete registration information.</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>Professional verification may be required for certain products restricted to licensed dental practitioners.</li>
                    <li>We reserve the right to suspend accounts that violate these terms.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Orders & Payments</h2>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem' }}>
                    <li>All prices are listed in Indian Rupees (₹) and include applicable GST.</li>
                    <li>Payment is processed securely through Razorpay. We verify payment signatures server-side.</li>
                    <li>Orders are confirmed only after successful payment verification.</li>
                    <li>We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspicious activity.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Shipping & Delivery</h2>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem' }}>
                    <li>Shipping is handled through Shiprocket and partner courier services.</li>
                    <li>Estimated delivery times are provided but are not guaranteed.</li>
                    <li>Risk of loss transfers to you upon delivery to the shipping carrier.</li>
                    <li>Shipping is available within India. International shipping is not currently supported.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Cancellations & Returns</h2>
                <ul style={{ lineHeight: 1.7, color: '#374151', paddingLeft: '1.5rem' }}>
                    <li>Orders can be cancelled before shipment through your dashboard.</li>
                    <li>Returns are accepted within 7 days of delivery for defective or incorrect items.</li>
                    <li>Refunds are processed to the original payment method within 5-7 business days.</li>
                    <li>Items must be unused and in original packaging for return eligibility.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Intellectual Property</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    All content on the Platform, including brand logos, product images, and text, is the property
                    of Alpha Dentkart or its licensed partners. Unauthorized reproduction or distribution is prohibited.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Limitation of Liability</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    Alpha Dentkart is not liable for any indirect, incidental, or consequential damages arising
                    from your use of the Platform. Our total liability is limited to the amount paid for the
                    specific product or service in question.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>8. Governing Law</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
                    jurisdiction of the courts in New Delhi, India.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>9. Contact</h2>
                <p style={{ lineHeight: 1.7, color: '#374151' }}>
                    Questions about these terms? Contact us at: <a href="mailto:sales@alphadentkart.com" style={{ color: '#2563eb' }}>sales@alphadentkart.com</a>
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
