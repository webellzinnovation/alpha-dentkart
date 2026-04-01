import dotenv from 'dotenv';

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function testRazorpayOrderCreation() {
    console.log('--- Razorpay Integration Test ---');
    console.log('Key ID:', RAZORPAY_KEY_ID);
    console.log('Key Secret:', RAZORPAY_KEY_SECRET ? '******' : 'MISSING');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.error('❌ Error: Razorpay credentials missing from .env');
        process.exit(1);
    }

    const amount = 100; // ₹100
    const currency = 'INR';
    const receipt = `test_rcpt_${Date.now()}`;

    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    console.log('Authorization Header: Basic', basicAuth.substring(0, 10) + '...');

    try {
        console.log('Sending request to Razorpay API...');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: JSON.stringify({
                amount: amount * 100, // in paise
                currency,
                receipt,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Order created:', data.id);
            console.log('Total Amount:', data.amount / 100, currency);
        } else {
            console.error('❌ Failed to create order:', data.error);
        }
    } catch (error) {
        console.error('❌ Connection error:', error);
    }
}

testRazorpayOrderCreation();
