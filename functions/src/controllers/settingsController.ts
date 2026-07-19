import { Request, Response } from 'express';
import { db, withTimeout } from '../config/firebase';
import logger from '../utils/logger';
import { emailService } from '../services/EmailService';

const SETTINGS_DOC = 'settings/store';

// In-memory cache for settings
let settingsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60; // 1 minute for settings

// Helper to sanitize SMTP and payment secrets from the settings object sent to clients
const sanitizeSettingsForClient = (settings: any) => {
    if (!settings) return null;
    const clean = JSON.parse(JSON.stringify(settings)); // deep clone to avoid mutating cache
    if (clean.payment) {
        if (clean.payment.phonepe) {
            delete clean.payment.phonepe.saltKey;
        }
        if (clean.payment.razorpay) {
            delete clean.payment.razorpay.keySecret;
        }
    }
    if (clean.email?.smtp) {
        delete clean.email.smtp.password;
    }
    return clean;
};

// Get store settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        // Check memory cache first (fastest)
        if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL * 1000) {
            return res.json({ settings: sanitizeSettingsForClient(settingsCache.data) });
        }

        const doc = await withTimeout(db.doc(SETTINGS_DOC).get());
        if (!doc.exists) {
            // Return default settings if none exist
            return res.json({ settings: null });
        }
        
        const settings = doc.data();
        
        // Cache the result
        settingsCache = { data: settings, timestamp: Date.now() };
        
        res.json({ settings: sanitizeSettingsForClient(settings) });
    } catch (error: any) {
        logger.error('Error fetching settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to fetch settings' });
    }
};

// Update store settings (admin only)
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        await withTimeout(db.doc(SETTINGS_DOC).set(
            { ...updates, updatedAt: new Date().toISOString() },
            { merge: true }
        ));
        
        // Clear cache
        settingsCache = null;
        
        const updated = await withTimeout(db.doc(SETTINGS_DOC).get());
        res.json({ settings: sanitizeSettingsForClient(updated.data()), message: 'Settings saved successfully' });
    } catch (error: any) {
        logger.error('Error updating settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to update settings' });
    }
};

// Send test email for template verification
export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        const { to, templateType, message } = req.body;
        if (!to) {
            return res.status(400).json({ error: 'Recipient email is required' });
        }

        let subject = 'Alpha Dentkart - Test Email';
        let html = '';

        switch (templateType) {
            case 'orderConfirmation': {
                subject = 'Order Confirmation (Test) - Alpha Dentkart';
                const innerHtml = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #dcfce7; color: #15803d; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">✓</div>
                        <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Order Confirmed!</h2>
                        <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Thank you for your business. We are packing your items!</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello Dr. Rajesh Gupta,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">${message || 'Thank you for your order! We have received it and will process it shortly.'}</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
                        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Details</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155;">
                                    <strong style="color: #0f172a;">3M ESPE Filtek Supreme Ultra Composite</strong><br>
                                    <span style="font-size: 12px; color: #64748b;">Qty: 2</span>
                                </td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">
                                    ₹8,400
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; color: #0f172a;">Total</td>
                                <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; text-align: right; color: #2563eb;">₹8,400</td>
                            </tr>
                        </table>
                    </div>
                `;
                html = emailService.getHtmlWrapper(subject, innerHtml, 'Test order confirmation details.');
                break;
            }
            case 'orderShipped': {
                subject = 'Order Shipped (Test) - Alpha Dentkart';
                const innerHtml = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #e0f2fe; color: #0369a1; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">🚚</div>
                        <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Your Order is Shipped!</h2>
                        <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Your package is officially on its way.</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi Dr. Rajesh Gupta,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">${message || 'Your order has been shipped and is on its way.'}</p>
                    
                    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin: 30px 0;">
                        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 700; color: #0369a1;">Delivery Tracking</h3>
                        <div style="font-size: 14px; color: #334155; line-height: 1.7;">
                            <p style="margin: 0 0 8px 0;"><strong>Courier Partner:</strong> Delhivery</p>
                            <p style="margin: 0 0 16px 0;"><strong>AWR Tracking No:</strong> <code style="background-color: #e0f2fe; padding: 3px 6px; border-radius: 4px; font-weight: 600;">SR9876543210IN</code></p>
                        </div>
                        <div style="text-align: center; margin-top: 15px;">
                            <a href="https://track.shiprocket.in" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">Track Shipments</a>
                        </div>
                    </div>
                `;
                html = emailService.getHtmlWrapper(subject, innerHtml, 'Test order shipment update.');
                break;
            }
            case 'orderDelivered': {
                subject = 'Order Delivered (Test) - Alpha Dentkart';
                const innerHtml = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #dcfce7; color: #15803d; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">✓</div>
                        <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Order Delivered!</h2>
                        <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Great news! Your package was delivered successfully.</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi Dr. Rajesh Gupta,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">${message || 'Great news! Your order has been delivered successfully. Thank you for shopping with us!'}</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                        <p style="font-size: 14px; color: #475569; margin: 0 0 10px 0;">How was your delivery experience?</p>
                        <div style="margin-top: 10px;">
                            <a href="https://alphadentkart-001.web.app/orders" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">Share Feedback</a>
                        </div>
                    </div>
                `;
                html = emailService.getHtmlWrapper(subject, innerHtml, 'Test order delivered confirmation.');
                break;
            }
            case 'orderCancelled': {
                subject = 'Order Cancelled (Test) - Alpha Dentkart';
                const innerHtml = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #fee2e2; color: #b91c1c; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">✕</div>
                        <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; color: #b91c1c;">Order Cancelled</h2>
                        <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Your order has been cancelled.</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi Dr. Rajesh Gupta,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">${message || 'Your order has been cancelled as requested. If you have any questions, please contact our support team.'}</p>
                `;
                html = emailService.getHtmlWrapper(subject, innerHtml, 'Test order cancellation notification.');
                break;
            }
            case 'welcome': {
                subject = 'Welcome to Alpha Dentkart (Test)';
                const innerHtml = `
                    <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Welcome to the Family, Dr. Rajesh Gupta! 🎉</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">${message || 'Welcome to Alpha Dentkart! Get 15% OFF on your first order with code WELCOME15. Valid for 7 days.'}</p>
                    
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                        <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Use Voucher Code</p>
                        <div style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 2px; margin: 0 0 10px 0;">WELCOME15</div>
                        <div class="badge badge-success">Get 15% OFF (Valid for 7 days)</div>
                    </div>
                `;
                html = emailService.getHtmlWrapper(subject, innerHtml, 'Welcome test discount details.');
                break;
            }
            default:
                subject = 'Alpha Dentkart - Custom Test Email';
                html = emailService.getHtmlWrapper(subject, `<p style="font-size: 15px; line-height: 1.6;">${message || 'This is a custom test email.'}</p>`, 'Custom test mail.');
        }

        await emailService.sendEmail(to, subject, html);
        res.json({ success: true, message: `Test email successfully sent to ${to}` });
    } catch (error: any) {
        logger.error('Error sending test email:', error);
        res.status(500).json({ error: error.message || 'Failed to send test email' });
    }
};
