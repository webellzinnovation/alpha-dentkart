"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * EmailService handles all transactional email communications
 * for Alpha Dentkart, including account verification and password resets.
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }
    initializeTransporter() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            this.transporter = nodemailer_1.default.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT || '587'),
                secure: SMTP_PORT === '465',
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
            logger_1.default.info('EmailService initialized with SMTP transporter');
        }
        else {
            logger_1.default.warn('EmailService: SMTP credentials missing. Emails will be logged to console only.');
        }
    }
    /**
     * Send a verification email to a new user
     */
    async sendVerificationEmail(email, token, name) {
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
     * Send a password reset email
     */
    async sendPasswordResetEmail(email, token, name) {
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
    async sendEmail(to, subject, html) {
        if (!this.transporter) {
            logger_1.default.info('MOCK EMAIL SEND', { to, subject });
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
            logger_1.default.info('Email sent successfully', { messageId: info.messageId, to });
            return info;
        }
        catch (error) {
            logger_1.default.error('Failed to send email', { error, to, subject });
            throw new Error('Email delivery failed');
        }
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=EmailService.js.map