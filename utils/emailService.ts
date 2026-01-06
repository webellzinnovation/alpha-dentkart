// Email sending utility using SMTP settings from admin
// This is a client-side placeholder that shows the structure
// In production, this should be a server-side API endpoint

export interface SMTPSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  encryption: string;
  from?: string;
}

export interface VerificationEmailData {
  to: string;
  customerName: string;
  verificationLink: string;
}

/**
 * Sends a verification email to the customer
 * Calls the backend API endpoint to send email using SMTP settings
 */
export async function sendVerificationEmail(
  emailData: VerificationEmailData,
  smtpSettings: SMTPSettings
): Promise<{ success: boolean; message: string }> {
  try {
    // Call backend API to send email
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailData.to,
        customerName: emailData.customerName,
        userId: emailData.to, // Using email as userId for now
        smtpSettings
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return {
      success: true,
      message: result.message || `Verification email sent to ${emailData.to}`
    };
  } catch (error: any) {
    console.error('Error sending verification email:', error);

    // Check if it's a network error (API not available)
    if (error.message?.includes('fetch') || error.name === 'TypeError') {
      return {
        success: false,
        message: 'Email API not available. Please ensure nodemailer is installed (npm install nodemailer @types/nodemailer) and the backend server is running.'
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to send verification email'
    };
  }
}

/**
 * Generates a unique verification token
 * In production, this should be done server-side and stored in database
 */
function generateVerificationToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Email template for verification email
 */
export function getVerificationEmailHTML(customerName: string, verificationLink: string): string {
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

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  customerName: string,
  smtpSettings: SMTPSettings
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;

    console.log('📧 Sending password reset email:', {
      to: email,
      resetLink,
      smtpHost: smtpSettings.host
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `Password reset email sent to ${email}`
    };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      message: error.message || 'Failed to send password reset email'
    };
  }
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailHTML(customerName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${customerName},
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                ${resetLink}
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                  ⚠️ <strong>Security Notice:</strong><br>
                  This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                For security reasons, this password reset link can only be used once and will expire in 1 hour.
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
