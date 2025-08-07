
const { sendPushNotification } = require('../auth/PushNotification');
const { getNotificationSettings } = require('../services/NotificationService');
const { getNotificationPolicy } = require('./PolicyService');

/**
 * Sends notifications based on the notification settings.
 *
 * @param {String} companyId - The company ID
 * @param {String} action - Action key from notification settings (e.g., 'leaveApplied', 'taskAssigned')
 * @param {Object} options - Options including to, subject, message, data, etc.
 * @param {String[]} [options.emailTo] - Email recipients
 * @param {String[]} [options.fcmTokens] - FCM tokens for push
 * @param {String} [options.subject] - Email subject
 * @param {String} [options.message] - Message body
 * @param {Object} [options.payload] - Optional payload for push
 */
async function triggerNotification(companyId, module = "", action = "", options = {}) {
    try {
        // get from notification settings
        const notificationSettings = await getNotificationSettings(companyId);
        const isAllowNotify = notificationSettings[module][action];
        if (!isAllowNotify) {
            return;
        }
        // get from company policy
        const notificationPolicy = await getNotificationPolicy(companyId);
        const { emailReminders, pushNotifications } = notificationPolicy;

        if (!emailReminders && !pushNotifications) {
            console.warn(`Notification config not found for action: ${action}`);
            return;
        }
        if (emailReminders && options.emailTo?.length) {
            await sendEmail({
                to: options.emailTo,
                subject: options.subject,
                text: options.message,
            });
        }
        if (pushNotifications && options.fcmTokens?.length) {
            await sendPushNotification({
                tokens: options.fcmTokens,
                title: options.subject || 'Notification',
                body: options.message,
                data: options.payload || {},
            });
        }
    } catch (err) {
        console.error(`Error in triggerNotification [${action}]:`, err);
    }
}

module.exports = { triggerNotification };
