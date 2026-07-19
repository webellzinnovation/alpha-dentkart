import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'functions/.env') });

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

async function main() {
    // Get target email from arguments or default to workspace email
    const targetEmail = process.argv[2] || 'webellzinnovation@gmail.com';
    
    console.log("Using SMTP settings:");
    console.log(`Host: ${SMTP_HOST}`);
    console.log(`Port: ${SMTP_PORT}`);
    console.log(`User: ${SMTP_USER}`);
    console.log(`Sender: ${SMTP_FROM}`);
    console.log(`Sending test email to: ${targetEmail}...`);

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.error("❌ Error: SMTP credentials missing from functions/.env");
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '465'),
        secure: SMTP_PORT === '465',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: SMTP_FROM || SMTP_USER,
            to: targetEmail,
            subject: 'Alpha Dentkart - SMTP Connection Test 🚀',
            text: 'Hello! This is a test email sent from the newly configured Hostinger SMTP server for Alpha Dentkart.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb; margin-top: 0;">SMTP Test Successful! 🚀</h2>
                    <p>Hello,</p>
                    <p>This is a test email confirming that your Hostinger SMTP server has been successfully configured for <strong>new@alphadentkart.com</strong>.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This email was generated automatically by the Alpha Dentkart development environment.</p>
                </div>
            `
        });

        console.log(`\n🎉 Success! Email sent successfully.`);
        console.log(`Message ID: ${info.messageId}`);
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error sending email:", error.message);
        process.exit(1);
    }
}

main();
