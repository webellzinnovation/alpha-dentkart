import nodemailer from 'nodemailer';
import logger from '../utils/logger';

/**
 * EmailService handles all transactional email communications
 * for Alpha Dentkart, including account verification and password resets.
 */
class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT || '587'),
                secure: SMTP_PORT === '465',
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
            logger.info('EmailService initialized with SMTP transporter');
        } else {
            logger.warn('EmailService: SMTP credentials missing. Emails will be logged to console only.');
        }
    }

    /**
     * Send a verification email to a new user
     */
    async sendVerificationEmail(email: string, token: string, name: string) {
        const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
        const verificationLink = `${baseUrl}/verify-email?token=${token}`;
        
        const subject = 'Welcome to Alpha Dentkart - Verify your Email';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                    <p style="color: #64748b; font-size: 14px;">Premium Dental Supplies</p>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Hello ${name},</h2>
                <p style="font-size: 16px; line-height: 1.6;">Thank you for joining Alpha Dentkart. To complete your registration and unlock all features, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Email Address</a>
                </div>
                <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 12px; word-break: break-all; color: #3b82f6;">${verificationLink}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    /**
     * Send a welcome email after successful registration
     */
    async sendWelcomeEmail(email: string, name: string) {
        const subject = 'Welcome to Alpha Dentkart!';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Welcome, ${name}!</h2>
                <p style="font-size: 16px; line-height: 1.6;">We're thrilled to have you as part of our community. Alpha Dentkart is India's leading platform for premium dental supplies.</p>
                <p style="font-size: 16px; line-height: 1.6;">You can now start browsing our extensive catalog and manage your professional orders with ease.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://alphadentkart-001.web.app/shop" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Start Shopping</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">Need help? Reply to this email or visit our help center.</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    /**
     * Send a password reset email
     */
    async sendPasswordResetEmail(email: string, token: string, name: string) {
        const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        
        const subject = 'Reset Your Alpha Dentkart Password';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Hi ${name || 'there'},</h2>
                <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                <p style="font-size: 16px; line-height: 1.6;">To reset your password, click the button below:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 12px; word-break: break-all; color: #3b82f6;">${resetLink}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 1 hour. Your password will not change until you access the link above and create a new one.</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    /**
     * Send an order confirmation email
     */
    async sendOrderConfirmationEmail(email: string, order: any) {
        const subject = `Order Confirmation - #${order.id} - Alpha Dentkart`;
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                    <p style="color: #64748b; font-size: 14px;">Thank you for your order!</p>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Order #${order.id}</h2>
                <p style="font-size: 16px; line-height: 1.6;">Hi ${order.shippingAddress?.name || 'Customer'},</p>
                <p style="font-size: 16px; line-height: 1.6;">We've received your order and are getting it ready for shipment. You'll receive another email once your items are on their way.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${order.items?.map((item: any) => `
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                                    ${item.name} x ${item.quantity}
                                </td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                    ₹${item.price * item.quantity}
                                </td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td style="padding: 15px 0 0; font-weight: 700;">Total</td>
                            <td style="padding: 15px 0 0; font-weight: 700; text-align: right;">₹${order.total}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="font-size: 16px; margin-bottom: 10px;">Shipping To:</h3>
                    <p style="font-size: 14px; color: #64748b; margin: 0;">
                        ${order.shippingAddress?.name}<br>
                        ${order.shippingAddress?.street}<br>
                        ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}<br>
                        Phone: ${order.shippingAddress?.phone}
                    </p>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you have any questions, please contact our support team at support@alphadentkart.com</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    /**
     * Send an order shipped email
     */
    async sendOrderShippedEmail(email: string, order: any) {
        const subject = `Order Shipped - #${order.id} - Alpha Dentkart`;
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                    <p style="color: #64748b; font-size: 14px;">Your order is on its way!</p>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Good news!</h2>
                <p style="font-size: 16px; line-height: 1.6;">Hi ${order.customerName || 'there'},</p>
                <p style="font-size: 16px; line-height: 1.6;">Your order #${order.id} has been shipped and is heading your way.</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #bae6fd;">
                    <h3 style="margin-top: 0; font-size: 16px; color: #0369a1;">Tracking Information</h3>
                    <p style="font-size: 14px; margin: 10px 0;"><strong>Courier:</strong> ${order.trackingProvider || 'Standard'}</p>
                    <p style="font-size: 14px; margin: 10px 0;"><strong>Tracking ID:</strong> ${order.trackingNumber || 'N/A'}</p>
                    ${order.trackingUrl ? `
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="${order.trackingUrl}" style="background-color: #0369a1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Track Order</a>
                        </div>
                    ` : ''}
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">Need help? Contact support@alphadentkart.com</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    /**
     * Send verification status email
     */
    async sendVerificationStatusEmail(email: string, name: string, status: 'approved' | 'rejected', reason?: string) {
        const subject = status === 'approved' 
            ? 'Account Verified - Alpha Dentkart' 
            : 'Action Required: Verification Update - Alpha Dentkart';
            
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Alpha Dentkart</h1>
                </div>
                <h2 style="font-size: 20px; font-weight: 600;">Hello ${name},</h2>
                ${status === 'approved' ? `
                    <p style="font-size: 16px; line-height: 1.6; color: #166534;">Congratulations! Your professional account has been verified.</p>
                    <p style="font-size: 16px; line-height: 1.6;">You now have full access to professional pricing and bulk ordering features.</p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="https://alphadentkart-001.web.app/dashboard" style="background-color: #166534; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Go to Dashboard</a>
                    </div>
                ` : `
                    <p style="font-size: 16px; line-height: 1.6; color: #991b1b;">Your account verification could not be completed at this time.</p>
                    ${reason ? `<div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;"><p style="font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
                    <p style="font-size: 16px; line-height: 1.6;">Please log in to your dashboard to update your information or upload the required documents again.</p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="https://alphadentkart-001.web.app/dashboard" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Update Info</a>
                    </div>
                `}
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message regarding your professional account status.</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    private async sendEmail(to: string, subject: string, html: string) {
        if (!this.transporter) {
            logger.info('MOCK EMAIL SEND', { to, subject });
            // In development/test with no SMTP, we just log the action
            return { messageId: 'mock-id-' + Date.now() };
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Alpha Dentkart" <noreply@alphadentkart.com>',
                to,
                subject,
                html,
            });
            logger.info('Email sent successfully', { messageId: info.messageId, to });
            return info;
        } catch (error) {
            logger.error('Failed to send email', { error, to, subject });
            throw new Error('Email delivery failed');
        }
    }
}

export const emailService = new EmailService();
