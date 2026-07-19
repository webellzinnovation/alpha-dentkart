import { Request, Response } from 'express';
import crypto from 'crypto';
import { db, admin } from '../config/firebase';
import logger from '../utils/logger';

// Load config from Firestore or process.env fallback
async function getPhonePeConfig() {
    try {
        const doc = await db.doc('settings/store').get();
        if (doc.exists) {
            const data = doc.data();
            const phonepe = data?.payment?.phonepe;
            if (phonepe?.enabled && phonepe?.merchantId && phonepe?.saltKey) {
                return {
                    merchantId: phonepe.merchantId,
                    saltKey: phonepe.saltKey,
                    saltIndex: phonepe.saltIndex || '1',
                    env: phonepe.env || 'STAGE'
                };
            }
        }
    } catch (err) {
        logger.error('Failed to load PhonePe settings from Firestore', { error: err });
    }

    return {
        merchantId: process.env.PHONEPE_MERCHANT_ID || '',
        saltKey: process.env.PHONEPE_SALT_KEY || '',
        saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
        env: process.env.PHONEPE_ENV || 'STAGE' // STAGE or PROD
    };
}

/**
 * Initiate PhonePe payment request and return hosted payment page URL
 */
export const initiatePhonePePayment = async (req: Request, res: Response) => {
    try {
        const { amount, customerMobile, customerEmail, orderId, redirectUrl } = req.body;

        if (!amount || !orderId || !redirectUrl) {
            return res.status(400).json({ error: 'Missing required parameters: amount, orderId, redirectUrl' });
        }

        const config = await getPhonePeConfig();
        if (!config.merchantId || !config.saltKey) {
            return res.status(500).json({ error: 'PhonePe integration is not configured' });
        }

        // Amount in PhonePe is in Paisa (1 Rupee = 100 Paisa)
        const amountInPaisa = Math.round(amount * 100);

        const baseUrl = process.env.FUNCTIONS_URL || process.env.API_URL || 'https://api-pixpfhd4qa-el.a.run.app';
        const callbackUrl = `${baseUrl}/api/v1/payments/phonepe/callback`;

        // Payload structure required by PhonePe
        const payload = {
            merchantId: config.merchantId,
            merchantTransactionId: orderId,
            merchantUserId: customerEmail || 'guest_' + Date.now(),
            amount: amountInPaisa,
            redirectUrl: redirectUrl,
            redirectMode: 'REDIRECT',
            callbackUrl: callbackUrl,
            mobileNumber: customerMobile || '',
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const jsonPayload = JSON.stringify(payload);
        const base64Payload = Buffer.from(jsonPayload).toString('base64');

        // Checksum calculation
        const stringToSign = base64Payload + '/pg/v1/pay' + config.saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + config.saltIndex;

        // Select environment endpoint
        const phonePeUrl = config.env === 'PROD' 
            ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
            : 'https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay';

        logger.info('Initiating PhonePe payment request', { orderId, amount: amountInPaisa, env: config.env });

        const response = await fetch(phonePeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({ request: base64Payload })
        });

        const responseText = await response.text();
        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            logger.error('Failed to parse PhonePe API response', { responseText });
            return res.status(502).json({ error: 'Invalid response from PhonePe gateway' });
        }

        if (response.ok && result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
            const gatewayUrl = result.data.instrumentResponse.redirectInfo.url;
            return res.json({ success: true, redirectUrl: gatewayUrl });
        } else {
            logger.error('PhonePe API Error response', { result });
            return res.status(400).json({ error: result.message || 'Payment initiation failed' });
        }

    } catch (error: any) {
        logger.error('PhonePe initiate payment error:', error);
        res.status(500).json({ error: error.message || 'Internal payment error' });
    }
};

/**
 * Public Callback Webhook to receive payment confirmations from PhonePe
 */
export const handlePhonePeCallback = async (req: Request, res: Response) => {
    try {
        const xVerify = req.header('X-VERIFY');
        const { response } = req.body; // Base64 encoded payload from PhonePe

        if (!xVerify || !response) {
            logger.error('PhonePe callback missing X-VERIFY header or response body');
            return res.status(400).send('Bad Request');
        }

        const config = await getPhonePeConfig();
        if (!config.saltKey) {
            logger.error('PhonePe configurations missing on callback verify');
            return res.status(500).send('Internal Server Error');
        }

        // Verify checksum signature
        const stringToSign = response + config.saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const calculatedChecksum = sha256 + '###' + config.saltIndex;

        if (calculatedChecksum !== xVerify) {
            logger.warn('PhonePe checksum signature verification failed', { received: xVerify, calculated: calculatedChecksum });
            return res.status(401).send('Unauthorized Signature');
        }

        // Decode payload
        const decodedPayload = Buffer.from(response, 'base64').toString('utf8');
        const callbackData = JSON.parse(decodedPayload);

        logger.info('PhonePe Callback received', { callbackData });

        if (callbackData.success && callbackData.code === 'PAYMENT_SUCCESS') {
            const orderId = callbackData.data.merchantTransactionId;
            const transactionId = callbackData.data.transactionId;
            const amountPaid = callbackData.data.amount / 100; // back to Rupees

            logger.info('PhonePe Payment Success verified', { orderId, transactionId, amountPaid });

            // Fetch temp order placeholder or finalize order checkout directly
            // In Alpha Dentkart, orders are finalized on confirmation:
            // Write order details or set order transactionPaid flag
            const orderRef = db.collection('orders').doc(orderId);
            const orderDoc = await orderRef.get();

            if (orderDoc.exists) {
                await orderRef.set({
                    paymentStatus: 'paid',
                    status: 'Processing',
                    statusHistory: admin.firestore.FieldValue.arrayUnion({
                        status: 'Processing',
                        timestamp: new Date().toISOString(),
                        note: 'PhonePe payment completed successfully. Order marked as Processing.'
                    }),
                    phonepeTransactionId: transactionId,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                // Trigger transactional email
                const { emailService } = await import('../services/EmailService');
                const orderData = orderDoc.data();
                if (orderData && orderData.customerEmail) {
                    try {
                        await emailService.sendOrderConfirmationEmail(orderData.customerEmail, { id: orderId, ...orderData, paymentStatus: 'paid', status: 'Processing' });
                    } catch (emailErr) {
                        logger.error('Failed to send confirmation email on PhonePe callback success', { error: emailErr });
                    }
                }
            } else {
                // Save payment callback state in collections so checkout completion can query it
                await db.collection('phonepe_callbacks').doc(orderId).set({
                    success: true,
                    transactionId,
                    amountPaid,
                    code: callbackData.code,
                    timestamp: new Date().toISOString()
                });
                logger.info('Logged PhonePe success callback prior to order document creation', { orderId });
            }
        } else {
            const orderId = callbackData.data?.merchantTransactionId || 'unknown';
            logger.warn('PhonePe Payment Failure callback received', { orderId, code: callbackData.code });
            
            await db.collection('phonepe_callbacks').doc(orderId).set({
                success: false,
                code: callbackData.code,
                message: callbackData.message || 'Payment failed',
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).send('OK');
    } catch (error: any) {
        logger.error('PhonePe callback handler error:', error);
        res.status(500).send('Internal Error');
    }
};

/**
 * Check payment status by querying PhonePe Status API directly and updating Order status
 */
export const checkPhonePeCallback = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const config = await getPhonePeConfig();
        if (!config.merchantId || !config.saltKey) {
            return res.status(500).json({ error: 'PhonePe integration is not configured' });
        }

        // Query PhonePe Status API directly
        const path = `/pg/v1/status/${config.merchantId}/${orderId}`;
        const stringToSign = path + config.saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + config.saltIndex;

        const statusUrl = config.env === 'PROD'
            ? `https://api.phonepe.com/apis/hermes${path}`
            : `https://api-preprod.phonepe.com/apis/hermes${path}`;

        logger.info('Querying PhonePe Status API directly', { orderId, env: config.env });

        const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': config.merchantId
            }
        });

        const responseText = await response.text();
        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            logger.error('Failed to parse PhonePe Status response', { responseText });
            return res.status(502).json({ error: 'Invalid response from PhonePe status check' });
        }

        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (result.success && result.code === 'PAYMENT_SUCCESS') {
            const transactionId = result.data?.transactionId || '';
            const amountPaid = (result.data?.amount || 0) / 100;

            if (orderDoc.exists) {
                const orderData = orderDoc.data();
                if (orderData?.paymentStatus !== 'paid') {
                    await orderRef.set({
                        paymentStatus: 'paid',
                        status: 'Processing',
                        statusHistory: admin.firestore.FieldValue.arrayUnion({
                            status: 'Processing',
                            timestamp: new Date().toISOString(),
                            note: 'PhonePe payment verified successfully via Status API.'
                        }),
                        phonepeTransactionId: transactionId,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });

                    // Trigger transactional email
                    const { emailService } = await import('../services/EmailService');
                    if (orderData.customerEmail) {
                        try {
                            await emailService.sendOrderConfirmationEmail(orderData.customerEmail, { id: orderId, ...orderData, paymentStatus: 'paid', status: 'Processing' });
                        } catch (emailErr) {
                            logger.error('Failed to send confirmation email on PhonePe Status API success', { error: emailErr });
                        }
                    }
                }
            }

            return res.json({ status: 'success', transactionId });
        } else {
            // Payment failed, cancelled or pending
            const isPending = result.code === 'PAYMENT_PENDING' || result.code === 'INTERNAL_SERVER_ERROR';
            const message = result.message || 'Payment failed or cancelled';

            if (!isPending && orderDoc.exists) {
                const orderData = orderDoc.data();
                if (orderData?.paymentStatus !== 'failed') {
                    await orderRef.set({
                        paymentStatus: 'failed',
                        status: 'Payment Failed',
                        statusHistory: admin.firestore.FieldValue.arrayUnion({
                            status: 'Payment Failed',
                            timestamp: new Date().toISOString(),
                            note: `PhonePe payment marked as failed: ${message}`
                        }),
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            }

            return res.json({
                status: isPending ? 'pending' : 'failed',
                message
            });
        }
    } catch (error: any) {
        logger.error('Error in checkPhonePeCallback status API', { error });
        res.status(500).json({ error: error.message });
    }
};
