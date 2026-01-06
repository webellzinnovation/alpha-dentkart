// API endpoint for testing SMTP connection
// POST /api/test-smtp-connection

import type { NextApiRequest, NextApiResponse } from 'next';

interface TestSMTPRequest {
    smtpSettings: {
        host: string;
        port: number;
        user: string;
        pass: string;
        encryption: string;
    };
}

interface TestSMTPResponse {
    success: boolean;
    message: string;
}

/**
 * API endpoint to test SMTP connection
 * POST /api/test-smtp-connection
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TestSMTPResponse>
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { smtpSettings }: TestSMTPRequest = req.body;

        // Validate SMTP settings
        if (!smtpSettings || !smtpSettings.host || !smtpSettings.port || !smtpSettings.user || !smtpSettings.pass) {
            return res.status(400).json({
                success: false,
                message: 'Invalid SMTP settings. Please provide host, port, username, and password.'
            });
        }

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

        // Test the connection
        await transporter.verify();

        console.log('SMTP connection test successful:', {
            host: smtpSettings.host,
            port: smtpSettings.port,
            user: smtpSettings.user
        });

        return res.status(200).json({
            success: true,
            message: `Successfully connected to ${smtpSettings.host}:${smtpSettings.port}\n\nYour SMTP settings are configured correctly and ready to send emails.`
        });

    } catch (error: any) {
        console.error('SMTP connection test failed:', error);

        // Provide helpful error messages based on common issues
        let errorMessage = error.message || 'Unknown error occurred';

        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your username and password.\n\nFor Gmail, make sure you are using an App Password, not your regular password.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused. Please check:\n• SMTP host is correct\n• Port number is correct\n• Your firewall is not blocking the connection';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Please check:\n• SMTP host is reachable\n• Port number is correct\n• Your network connection';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = `Host not found: ${smtpSettings.host}\n\nPlease check that the SMTP host address is correct.`;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
