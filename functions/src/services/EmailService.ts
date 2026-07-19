import nodemailer from 'nodemailer';
import logger from '../utils/logger';

/**
 * EmailService handles all transactional email communications
 * for Alpha Dentkart, using modern, highly aesthetic and responsive layouts.
 */
class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

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
     * Shared premium layout wrapper for emails
     */
    public getHtmlWrapper(title: string, innerHtml: string, previewText?: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #f8fafc;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #1e293b;
                        -webkit-font-smoothing: antialiased;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
                        border: 1px solid #e2e8f0;
                    }
                    .header-banner {
                        background-color: #ffffff;
                        padding: 32px 20px;
                        text-align: center;
                        border-bottom: 2px solid #f1f5f9;
                    }
                    .content-body {
                        padding: 40px 32px;
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 24px 32px;
                        text-align: center;
                        border-top: 1px solid #f1f5f9;
                    }
                    .footer-text {
                        font-size: 12px;
                        color: #64748b;
                        line-height: 1.5;
                        margin: 0 0 10px 0;
                    }
                    .footer-links {
                        font-size: 12px;
                        color: #2563eb;
                        margin-top: 15px;
                    }
                    .footer-links a {
                        color: #2563eb;
                        text-decoration: none;
                        margin: 0 10px;
                    }
                    .btn-primary {
                        display: inline-block;
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        color: #ffffff !important;
                        padding: 14px 32px;
                        font-size: 15px;
                        font-weight: 600;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                    }
                    .badge {
                        display: inline-block;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 600;
                        border-radius: 9999px;
                    }
                    .badge-success {
                        background-color: #dcfce7;
                        color: #15803d;
                    }
                    .badge-info {
                        background-color: #e0f2fe;
                        color: #0369a1;
                    }
                    .badge-danger {
                        background-color: #fee2e2;
                        color: #b91c1c;
                    }
                </style>
            </head>
            <body>
                ${previewText ? `<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${previewText}</span>` : ''}
                <div class="email-container">
                    <div class="header-banner">
                        <img src="https://alphadentkart-001.web.app/Alpha-dentkart-logo-600p.png" alt="Alpha Dentkart Logo" style="height: 52px; max-width: 100%; display: inline-block; border: none; outline: none;" />
                    </div>
                    <div class="content-body">
                        ${innerHtml}
                    </div>
                    <div class="footer">
                        <p class="footer-text">© ${new Date().getFullYear()} Alpha Dentkart. All rights reserved.</p>
                        <p class="footer-text">This is an automated operational notification regarding your transactions.</p>
                        <div class="footer-links">
                            <a href="https://alphadentkart-001.web.app/privacy">Privacy Policy</a> • 
                            <a href="https://alphadentkart-001.web.app/terms">Terms of Service</a> • 
                            <a href="https://alphadentkart-001.web.app/support">Contact Support</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Send a verification email to a new user
     */
    async sendVerificationEmail(email: string, token: string, name: string) {
        const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
        const verificationLink = `${baseUrl}/verify-email?token=${token}`;
        
        const subject = 'Verify your Email - Alpha Dentkart';
        const innerHtml = `
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Hello ${name},</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">Thank you for registering an account on Alpha Dentkart. Please click the secure button below to verify your email address and activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" class="btn-primary">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 30px;">If the button doesn't work, copy and paste this link into your web browser:</p>
            <p style="font-size: 12px; color: #2563eb; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">${verificationLink}</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this mail.</p>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, 'Click to verify your email address and complete registration.'));
    }

    /**
     * Send a welcome email after successful registration
     */
    async sendWelcomeEmail(email: string, name: string) {
        const subject = 'Welcome to Alpha Dentkart!';
        const innerHtml = `
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Welcome to the Family, ${name}! 🎉</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">We're absolutely thrilled to welcome you. Alpha Dentkart is your dedicated partner for premium dental products, supplies, and clinical equipment in India.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">To kick off your journey, we have credited a special first-order discount voucher code to your account:</p>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Use Voucher Code</p>
                <div style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 2px; margin: 0 0 10px 0;">WELCOME15</div>
                <div class="badge badge-success">Get 15% OFF (Valid for 7 days)</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://alphadentkart-001.web.app/shop" class="btn-primary">Browse Premium Supplies</a>
            </div>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, 'Welcome! Get 15% off on your first order.'));
    }

    /**
     * Send a password reset email
     */
    async sendPasswordResetEmail(email: string, token: string, name: string) {
        const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        
        const subject = 'Reset Your Password - Alpha Dentkart';
        const innerHtml = `
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Hello ${name || 'there'},</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">We received a request to reset the password for your Alpha Dentkart account. If you did not make this request, you can safely ignore this email.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">To proceed with resetting your password, click the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="btn-primary" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 30px;">If you face any issues, please copy and paste the link below directly into your address bar:</p>
            <p style="font-size: 12px; color: #ef4444; word-break: break-all; background-color: #fff5f5; padding: 12px; border-radius: 8px; border: 1px solid #fee2e2;">${resetLink}</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link will automatically expire in 1 hour. Your password will remain unchanged until you submit a new one.</p>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, 'Secure link to reset your account password.'));
    }

    /**
     * Send an order confirmation email
     */
    async sendOrderConfirmationEmail(email: string, order: any) {
        const subject = `Order Confirmed - #${order.id}`;
        const innerHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #dcfce7; color: #15803d; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✓</div>
                <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Order Confirmed!</h2>
                <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Thank you for your business. We are packing your items!</p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello ${order.shippingAddress?.name || 'Customer'},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">We've received your order and are preparing it for shipment. We will send you another update with tracking info as soon as it leaves the warehouse.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    ${order.items?.map((item: any) => `
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155;">
                                <strong style="color: #0f172a;">${item.name}</strong><br>
                                <span style="font-size: 12px; color: #64748b;">Qty: ${item.quantity}</span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">
                                ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; color: #0f172a;">Total</td>
                        <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; text-align: right; color: #2563eb;">₹${order.total.toLocaleString('en-IN')}</td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; font-weight: 700;">Shipping Address</h3>
                <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0;">
                    <strong>${order.shippingAddress?.name}</strong><br>
                    ${order.shippingAddress?.street}<br>
                    ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.zip}<br>
                    <strong>Phone:</strong> ${order.shippingAddress?.phone}
                </p>
            </div>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, `Your order #${order.id} has been confirmed.`));
    }

    /**
     * Send an order shipped email
     */
    async sendOrderShippedEmail(email: string, order: any) {
        const subject = `Order Shipped - #${order.id}`;
        const innerHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #e0f2fe; color: #0369a1; font-size: 24px; font-weight: bold; margin-bottom: 16px;">🚚</div>
                <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Your Order is Shipped!</h2>
                <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Your package is officially on its way.</p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi ${order.customerName || 'Customer'},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">Exciting news! Your order #${order.id} has left our facility and is heading to your clinic/address.</p>
            
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 700; color: #0369a1;">Delivery Tracking</h3>
                <div style="font-size: 14px; color: #334155; line-height: 1.7;">
                    <p style="margin: 0 0 8px 0;"><strong>Courier Partner:</strong> ${order.trackingProvider || 'Standard Delivery'}</p>
                    <p style="margin: 0 0 16px 0;"><strong>AWR Tracking No:</strong> <code style="background-color: #e0f2fe; padding: 3px 6px; border-radius: 4px; font-weight: 600;">${order.trackingNumber || 'N/A'}</code></p>
                </div>
                ${order.trackingUrl ? `
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="${order.trackingUrl}" class="btn-primary" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); margin: 0;">Track Shipments</a>
                    </div>
                ` : ''}
            </div>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, `Track your order #${order.id} shipment status.`));
    }

    /**
     * Send an order delivered email
     */
    async sendOrderDeliveredEmail(email: string, order: any) {
        const subject = `Order Delivered - #${order.id}`;
        const innerHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #dcfce7; color: #15803d; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✓</div>
                <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Order Delivered!</h2>
                <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Great news! Your package was delivered successfully.</p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi ${order.customerName || 'Customer'},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">Your order #${order.id} has been successfully delivered to your shipping address. We hope you enjoy your premium dental supplies!</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #475569; margin: 0 0 10px 0;">How was your delivery experience?</p>
                <div style="margin-top: 10px;">
                    <a href="https://alphadentkart-001.web.app/orders" class="btn-primary" style="margin: 0;">Share Feedback / Rate Us</a>
                </div>
            </div>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, `Your order #${order.id} has been delivered successfully.`));
    }

    /**
     * Send an order cancelled email
     */
    async sendOrderCancelledEmail(email: string, order: any) {
        const subject = `Order Cancelled - #${order.id}`;
        const innerHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #fee2e2; color: #b91c1c; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✕</div>
                <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; color: #b91c1c;">Order Cancelled</h2>
                <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">Your order has been cancelled.</p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi ${order.customerName || 'Customer'},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">This email confirms that your order #${order.id} has been cancelled. Any payments processed will be refunded back to your original source of payment within 5-7 business days.</p>
            
            <div style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 15px; font-weight: 700;">Reason for Cancellation</h3>
                <p style="font-size: 14px; color: #475569; margin: 0;">${order.cancellationReason || 'Cancelled at customer request'}</p>
            </div>

            <p style="font-size: 14px; color: #64748b; line-height: 1.6;">If you have any questions or did not request this cancellation, please reach out to our helpdesk at support@alphadentkart.com.</p>
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, `Confirmation of cancellation for order #${order.id}.`));
    }

    /**
     * Send verification status email
     */
    async sendVerificationStatusEmail(email: string, name: string, status: 'approved' | 'rejected', reason?: string) {
        const isApproved = status === 'approved';
        const subject = isApproved 
            ? 'Account Verified - Alpha Dentkart' 
            : 'Action Required: Verification Update';
            
        const innerHtml = `
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Hello ${name},</h2>
            
            ${isApproved ? `
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="font-size: 15px; font-weight: 600; color: #166534; margin: 0;">Congratulations! Your clinical/professional credentials have been verified.</p>
                </div>
                <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">Your dental professional account is now fully active. You can log in to access exclusive wholesale B2B clinical pricing and bulk ordering structures.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://alphadentkart-001.web.app/dashboard" class="btn-primary" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">Access Dashboard</a>
                </div>
            ` : `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="font-size: 15px; font-weight: 600; color: #991b1b; margin: 0;">Clinical Verification Update Required</p>
                </div>
                <p style="font-size: 15px; line-height: 1.6; color: #334155;">We were unable to verify your clinical certificate or registration credentials with the provided documents.</p>
                ${reason ? `
                    <div style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <strong style="font-size: 14px; color: #0f172a;">Feedback:</strong>
                        <p style="font-size: 14px; color: #475569; margin: 6px 0 0 0; white-space: pre-wrap;">${reason}</p>
                    </div>
                ` : ''}
                <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">Please click the link below to upload valid dental practitioner licensing documents so our audit team can approve your profile:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://alphadentkart-001.web.app/dashboard" class="btn-primary" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">Re-upload Documents</a>
                </div>
            `}
        `;

        return this.sendEmail(email, subject, this.getHtmlWrapper(subject, innerHtml, isApproved ? 'Your professional dental account has been approved!' : 'Action required: document verification update needed.'));
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!this.transporter) {
            logger.info('MOCK EMAIL SEND', { to, subject });
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
