const nodemailer = require('nodemailer');
const postmark = require('postmark');
const EmailConfig = require('../models/EmailConfigModel');

// Function to get the active email configuration
const getActiveEmailConfig = async () => {
    try {
        const activeConfig = await EmailConfig.findOne({ isActive: true });
        return activeConfig || null;
    } catch (error) {
        console.error("❌ Error fetching email configuration:", error);
        return null;
    }
};

// Common function to send emails based on the active configuration
const sendMail = async (mailOptions) => {
    const activeConfig = await getActiveEmailConfig();

    if (!activeConfig) {
        console.error("❌ No active email configuration found.");
        return;
    }

    if (activeConfig.service === "nodemailer") {
        // Nodemailer Configuration
        const transporter = nodemailer.createTransport({
            host: activeConfig.mailHost,
            port: activeConfig.mailPort,
            secure: false,
            auth: {
                user: activeConfig.fromEmail,
                pass: activeConfig.mailPassword
            }
        });

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent via Nodemailer successfully`);
        } catch (error) {
            console.error("❌ Error sending email via Nodemailer:", error);
        }
    } else if (activeConfig.service === "postmark") {
        // Postmark Configuration
        const client = new postmark.ServerClient(activeConfig.apiToken);

        try {
            // console.log("mailOptions", mailOptions);
            await client.sendEmail(mailOptions);
            console.log(`📧 Email sent via Postmark successfully`);
        } catch (error) {
            console.error("❌ Error sending email via Postmark:", error);
        }
    } else {
        console.error("❌ Unknown email service:", activeConfig.service);
    }
};

module.exports = sendMail;

