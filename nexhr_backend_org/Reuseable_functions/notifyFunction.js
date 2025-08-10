
const { sendPushNotification } = require('../auth/PushNotification');
const sendEmailService = require('../routes/mailSender');
const { getNotificationSettings } = require('../services/NotificationService');
const { getNotificationPolicy } = require('../services/policyService');

/**
 * Sends email notifications based on company settings.
 *
 * @param {String} companyId - The company ID
 * @param {String} module - Module name (e.g., 'leave', 'task', 'wfh')
 * @param {String} action - Action key from notification settings (e.g., 'leaveApplied', 'taskAssigned')
 * @param {Object} options - Email options
 * @param {String|String[]} options.to - Email recipient(s)
 * @param {String} options.subject - Email subject
 * @param {String} [options.text] - Plain text message body
 * @param {String} [options.html] - HTML message body
 * @param {String} [options.from] - Sender email (optional, uses default config)
 */
async function sendMail(companyId, module = "", action = "", options = {}) {
    try {
        // Check notification settings
        const notificationSettings = await getNotificationSettings(companyId);
        const isAllowNotify = notificationSettings?.[module]?.[action];
        if (!isAllowNotify) {
            console.log(`Email notification disabled for ${module}.${action}`);
            return;
        }
        
        // Check company policy for email reminders
        const notificationPolicy = await getNotificationPolicy(companyId);
        const { emailReminders } = notificationPolicy;
        
        if (!emailReminders) {
            console.log(`Email reminders disabled for company: ${companyId}`);
            return;
        }
        
        // Validate required options
        if (!options.to || !options.subject) {
            console.error('Missing required email options: to, subject');
            return;
        }
        
        // Prepare mail options
        const mailOptions = {
            to: Array.isArray(options.to) ? options.to.join(',') : options.to,
            subject: options.subject,
            text: options.text || options.message || '',
            html: options.html || '',
            from: options.from || undefined // Use default from config
        };
        
        // Send email using the mail service
        await sendEmailService(mailOptions);
        console.log(`✅ Email sent successfully for ${module}.${action}`);
        
    } catch (err) {
        console.error(`❌ Error in sendMail [${module}.${action}]:`, err);
    }
}

/**
 * Sends push notifications based on company settings.
 *
 * @param {String} companyId - The company ID
 * @param {String} module - Module name (e.g., 'leave', 'task', 'wfh')
 * @param {String} action - Action key from notification settings (e.g., 'leaveApplied', 'taskAssigned')
 * @param {Object} options - Push notification options
 * @param {String|String[]} options.tokens - FCM token(s) for push notification
 * @param {String} options.title - Notification title
 * @param {String} options.body - Notification message body
 * @param {Object} [options.data] - Optional data payload
 * @param {String} [options.type] - Notification type
 * @param {String} [options.path] - Deep link path
 */
async function pushNotification(companyId, module = "", action = "", options = {}) {
    try {
        // Check notification settings
        const notificationSettings = await getNotificationSettings(companyId);
        const isAllowNotify = notificationSettings?.[module]?.[action];
        if (!isAllowNotify) {
            console.log(`Push notification disabled for ${module}.${action}`);
            return;
        }
        
        // Check company policy for push notifications
        const notificationPolicy = await getNotificationPolicy(companyId);
        const { pushNotifications } = notificationPolicy;
        
        if (!pushNotifications) {
            console.log(`Push notifications disabled for company: ${companyId}`);
            return;
        }
        
        // Validate required options
        if (!options.tokens || !options.title || !options.body) {
            console.error('Missing required push notification options: tokens, title, body');
            return;
        }
        
        // Handle single or multiple tokens
        const tokenArray = Array.isArray(options.tokens) ? options.tokens : [options.tokens];
        
        // Send push notification to each token
        const pushPromises = tokenArray.map(async (token) => {
            if (!token) return;
            
            try {
                await sendPushNotification({
                    token,
                    title: options.title,
                    body: options.body,
                    type: options.type || module,
                    path: options.path || '',
                    data: options.data || {}
                });
            } catch (error) {
                console.error(`Failed to send push notification to token: ${token}`, error);
            }
        });
        
        await Promise.all(pushPromises);
        console.log(`✅ Push notifications sent successfully for ${module}.${action} to ${tokenArray.length} tokens`);
        
    } catch (err) {
        console.error(`❌ Error in pushNotification [${module}.${action}]:`, err);
    }
}

module.exports = { 
    sendMail, 
    pushNotification 
};
