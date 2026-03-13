import { Request, Response } from 'express';
import * as nodemailer from 'nodemailer';
import { db } from '../config/firebase';
import logger from '../utils/logger';

const TRACKING_PROVIDERS = [
    { name: 'BlueDart', urlTemplate: 'https://www.bluedart.com/track/', urlParam: 'trackingNumber' },
    { name: 'Delhivery', urlTemplate: 'https://www.delhivery.com/track/package/', urlParam: 'trackingNumber' },
    { name: 'India Post', urlTemplate: 'https://www.indiapost.gov.in/', urlParam: '' },
    { name: 'FedEx', urlTemplate: 'https://www.fedex.com/fedextrack/', urlParam: 'trknums' },
    { name: 'DTDC', urlTemplate: 'https://www.dtdc.in/', urlParam: '' },
    { name: 'Ekart', urlTemplate: 'https://www.ekartlogistics.com/', urlParam: '' },
    { name: 'Amazon Easy', urlTemplate: 'https://www.amazon.in/tracking/', urlParam: 'ref' },
    { name: 'Flipkart', urlTemplate: 'https://www.flipkart.com/', urlParam: 'track' },
    { name: 'Other', urlTemplate: '', urlParam: '' }
];

export const sendCustomNotification = async (req: Request, res: Response) => {
    try {
        const { to, subject, message, isHtml } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
        }

        // Fetch SMTP settings from Firestore
        const settingsDoc = await db.doc('settings/store').get();
        if (!settingsDoc.exists) {
            return res.status(500).json({ error: 'Store settings not found. Please configure Email settings first.' });
        }

        const settings = settingsDoc.data();
        const emailSettings = settings?.email;

        if (!emailSettings || !emailSettings.host || !emailSettings.user || !emailSettings.pass) {
            return res.status(500).json({ error: 'Incomplete email configuration in store settings.' });
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: Number(emailSettings.port) || 587,
            secure: emailSettings.port === '465' || emailSettings.encryption === 'ssl',
            auth: {
                user: emailSettings.user,
                pass: emailSettings.pass
            }
        });

        // Send email
        const mailOptions: nodemailer.SendMailOptions = {
            from: `"${settings?.general?.storeName || 'Alpha Dentkart'}" <${emailSettings.user}>`,
            to,
            subject,
        };

        if (isHtml) {
            mailOptions.html = message;
        } else {
            mailOptions.text = message;
        }

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to ${to}: ${info.messageId}`);

        res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });

    } catch (error: any) {
        logger.error('Failed to send custom notification email:', error);
        res.status(500).json({ error: `Failed to send email: ${error.message}` });
    }
};

export const sendTrackingNotification = async (req: Request, res: Response) => {
    try {
        const { to, orderId, customerName, trackingProvider, trackingNumber, trackingUrl, orderTotal } = req.body;

        if (!to || !orderId || !trackingProvider || !trackingNumber) {
            return res.status(400).json({ error: 'Missing required fields: to, orderId, trackingProvider, trackingNumber' });
        }

        const settingsDoc = await db.doc('settings/store').get();
        if (!settingsDoc.exists) {
            return res.status(500).json({ error: 'Store settings not found' });
        }

        const settings = settingsDoc.data();
        const emailSettings = settings?.email;

        if (!emailSettings || !emailSettings.host || !emailSettings.user || !emailSettings.pass) {
            return res.status(500).json({ error: 'Email configuration not found' });
        }

        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: Number(emailSettings.port) || 587,
            secure: emailSettings.port === '465' || emailSettings.encryption === 'ssl',
            auth: {
                user: emailSettings.user,
                pass: emailSettings.pass
            }
        });

        const storeName = settings?.general?.storeName || 'Alpha Dentkart';
        const trackingLink = trackingUrl || `Track your package with ${trackingProvider}`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped - ${storeName}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #DD3B5F 0%, #FF6B8A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📦 Order Shipped!</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hi ${customerName || 'Customer'},</p>
        
        <p style="font-size: 16px; color: #333;">Great news! Your order has been shipped and is on its way!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Shipping Details</h3>
            
            <p style="margin: 8px 0; color: #555;">
                <strong>Order ID:</strong> ${orderId}
            </p>
            <p style="margin: 8px 0; color: #555;">
                <strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 14px; background: #e9ecef; padding: 2px 8px; border-radius: 4px;">${trackingNumber}</span>
            </p>
            <p style="margin: 8px 0; color: #555;">
                <strong>Courier:</strong> ${trackingProvider}
            </p>
            <p style="margin: 8px 0; color: #555;">
                <strong>Order Total:</strong> ₹${orderTotal || 'N/A'}
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingLink}" style="display: inline-block; background: #DD3B5F; color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Track Your Package →
            </a>
        </div>
        
        <p style="font-size: 14px; color: #777; margin-top: 30px;">
            You can also track your order by logging into your ${storeName} account.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
            Thank you for shopping with ${storeName}!
        </p>
    </div>
</body>
</html>
        `;

        const mailOptions: nodemailer.SendMailOptions = {
            from: `"${storeName}" <${emailSettings.user}>`,
            to,
            subject: `📦 Your Order ${orderId} has been Shipped! - ${storeName}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Tracking notification sent to ${to} for order ${orderId}`);

        res.json({ success: true, message: 'Tracking notification sent successfully', messageId: info.messageId });

    } catch (error: any) {
        logger.error('Failed to send tracking notification:', error);
        res.status(500).json({ error: `Failed to send tracking notification: ${error.message}` });
    }
};

export const sendOrderStatusNotification = async (req: Request, res: Response) => {
    try {
        const { to, orderId, customerName, orderStatus, orderTotal, orderDate } = req.body;

        if (!to || !orderId || !orderStatus) {
            return res.status(400).json({ error: 'Missing required fields: to, orderId, orderStatus' });
        }

        const settingsDoc = await db.doc('settings/store').get();
        if (!settingsDoc.exists) {
            return res.status(500).json({ error: 'Store settings not found' });
        }

        const settings = settingsDoc.data();
        const emailSettings = settings?.email;

        if (!emailSettings || !emailSettings.host || !emailSettings.user || !emailSettings.pass) {
            return res.status(500).json({ error: 'Email configuration not found' });
        }

        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: Number(emailSettings.port) || 587,
            secure: emailSettings.port === '465' || emailSettings.encryption === 'ssl',
            auth: {
                user: emailSettings.user,
                pass: emailSettings.pass
            }
        });

        const storeName = settings?.general?.storeName || 'Alpha Dentkart';
        
        const statusConfig: Record<string, { message: string; color: string; icon: string }> = {
            'Processing': { message: 'Your order is being processed and will be shipped soon.', color: '#3b82f6', icon: '📦' },
            'Shipped': { message: 'Your order has been shipped and is on its way!', color: '#8b5cf6', icon: '🚚' },
            'Delivered': { message: 'Your order has been delivered successfully!', color: '#10b981', icon: '✅' },
            'Cancelled': { message: 'Your order has been cancelled.', color: '#ef4444', icon: '❌' }
        };
        
        const config = statusConfig[orderStatus] || { message: 'Your order status has been updated.', color: '#6b7280', icon: '📋' };

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update - ${storeName}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #DD3B5F 0%, #FF6B8A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${config.icon} Order ${orderStatus}</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hi ${customerName || 'Customer'},</p>
        
        <div style="background: ${config.color}15; border-left: 4px solid ${config.color}; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: ${config.color}; margin: 0 0 10px 0;">Order ${orderStatus}</h3>
            <p style="color: #666666; margin: 0;">${config.message}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
            <p style="margin: 8px 0; color: #555;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Order Date:</strong> ${orderDate || 'N/A'}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Total Amount:</strong> ₹${orderTotal ? orderTotal.toLocaleString('en-IN') : 'N/A'}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Status:</strong> <span style="background: ${config.color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">${orderStatus}</span></p>
        </div>
        
        <p style="font-size: 14px; color: #777; margin-top: 30px;">
            Thank you for shopping with ${storeName}!
        </p>
    </div>
</body>
</html>
        `;

        const mailOptions: nodemailer.SendMailOptions = {
            from: `"${storeName}" <${emailSettings.user}>`,
            to,
            subject: `Order #${orderId} - Status Update: ${orderStatus} - ${storeName}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Order status notification sent to ${to} for order ${orderId}: ${orderStatus}`);

        res.json({ success: true, message: 'Order status notification sent successfully', messageId: info.messageId });

    } catch (error: any) {
        logger.error('Failed to send order status notification:', error);
        res.status(500).json({ error: `Failed to send order status notification: ${error.message}` });
    }
};
