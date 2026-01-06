// API endpoint for sending verification emails
// This would typically be in pages/api/send-verification-email.ts for Next.js
// or a similar backend route structure

import type { NextApiRequest, NextApiResponse } from 'next';

// Note: Install nodemailer first: npm install nodemailer @types/nodemailer

interface SendEmailRequest {
    to: string;
    customerName: string;
    userId: string;
    smtpSettings: {
        host: string;
        port: number;
        user: string;
        pass: string;
        encryption: string;
    };
}

interface SendEmailResponse {
    success: boolean;
    message: string;
    token?: string;
}

/**
 * API endpoint to send verification email
 * POST /api/send-verification-email
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SendEmailResponse>
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { to, customerName, userId, smtpSettings }: SendEmailRequest = req.body;

        // Validate required fields
        if (!to || !customerName || !userId || !smtpSettings) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate SMTP settings
        if (!smtpSettings.host || !smtpSettings.port || !smtpSettings.user || !smtpSettings.pass) {
            return res.status(400).json({
                success: false,
                message: 'Invalid SMTP settings'
            });
        }

        // Generate verification token
        const token = generateVerificationToken();
        const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify?token=${token}`;

        // Store token in database (implement this based on your database)
        await storeVerificationToken(userId, token);

        // Create nodemailer transporter
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.encryption === 'SSL', // true for 465, false for other ports
            auth: {
                user: smtpSettings.user,
                pass: smtpSettings.pass
            },
            tls: {
                rejectUnauthorized: false // For development only
            }
        });

        // Verify SMTP connection
        await transporter.verify();

        // Send email
        const info = await transporter.sendMail({
            from: `"Alpha Dentkart" <${smtpSettings.user}>`,
            to: to,
            subject: 'Verify Your Alpha Dentkart Account',
            html: getVerificationEmailHTML(customerName, verificationLink)
        });

        console.log('Email sent:', info.messageId);

        return res.status(200).json({
            success: true,
            message: `Verification email sent to ${to}`,
            token: token // Only for development/testing
        });

    } catch (error: any) {
        console.error('Error sending email:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send verification email'
        });
    }
}

/**
 * Generate a cryptographically secure verification token
 */
function generateVerificationToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Store verification token in database
 * TODO: Implement based on your database (MongoDB, PostgreSQL, etc.)
 */
async function storeVerificationToken(userId: string, token: string): Promise<void> {
    // Example for MongoDB:
    // await db.collection('verification_tokens').insertOne({
    //   userId,
    //   token,
    //   createdAt: new Date(),
    //   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    // });

    // Example for PostgreSQL:
    // await db.query(
    //   'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    //   [userId, token, new Date(Date.now() + 24 * 60 * 60 * 1000)]
    // );

    // For now, just log it (REMOVE IN PRODUCTION)
    console.log('Storing token:', { userId, token });
}

/**
 * Email template for verification email
 */
function getVerificationEmailHTML(customerName: string, verificationLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Alpha Dentkart</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${customerName},
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for registering with Alpha Dentkart! To complete your registration and access all features, please verify your email address by clicking the button below:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                ${verificationLink}
              </p>
              
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                This link will expire in 24 hours. If you didn't create an account with Alpha Dentkart, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Alpha Dentkart. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
