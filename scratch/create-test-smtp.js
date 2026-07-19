import nodemailer from 'nodemailer';

async function main() {
    try {
        console.log("Generating Ethereal SMTP test credentials...");
        const testAccount = await nodemailer.createTestAccount();
        console.log("\n🎉 Ethereal Test SMTP Account Created!");
        console.log("-----------------------------------------");
        console.log(`SMTP_HOST=${testAccount.smtp.host}`);
        console.log(`SMTP_PORT=${testAccount.smtp.port}`);
        console.log(`SMTP_USER=${testAccount.user}`);
        console.log(`SMTP_PASS=${testAccount.pass}`);
        console.log(`SMTP_FROM="Alpha Dentkart Test <${testAccount.user}>"`);
        console.log("-----------------------------------------");
        console.log(`\nEmail Log Panel: ${testAccount.web}`);
        process.exit(0);
    } catch (err) {
        console.error("Failed to create test account:", err);
        process.exit(1);
    }
}

main();
