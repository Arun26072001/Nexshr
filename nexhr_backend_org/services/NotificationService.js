const NotificationSettings = require('../models/NotificationSettingsModel');

class NotificationService {
  constructor() {
    this.defaultSettings = {
      leaveManagement: {
        application: true,
        approval: true,
        rejection: true,
        reminders: true,
        applicationUpdates: true,
        approvalDeadlines: true,
        balanceAlerts: false
      },
      wfhManagement: {
        application: true,
        approval: true,
        rejection: true,
        reminders: true,
        applicationUpdates: true,
        approvalDeadlines: true,
        teamLimitAlerts: true
      },
      employeeOnboarding: {
        welcomeEmails: true,
        credentialUpdates: true,
        documentReminders: true,
        onboardingProgress: true,
        completionNotifications: true,
        taskAssignments: true
      },
      attendanceManagement: {
        latePunchNotifications: true,
        breakReminders: false,
        dailyReports: false,
        overtimeAlerts: true,
        clockInReminders: true,
        clockOutReminders: true,
        attendanceAnomalies: true,
        monthlyReports: false
      },
      taskManagement: {
        assignment: true,
        completion: true,
        commentNotifications: true,
        deadlineReminders: true,
        statusUpdates: true,
        overdueTasks: true,
        projectUpdates: false
      },
      holidayNotifications: {
        holidayListCreation: true,
        holidayListUpdates: true,
        upcomingHolidays: true,
        holidayReminders: false,
        companyEvents: true
      },
      administrative: {
        timeScheduleChanges: true,
        annualLeaveRenewals: true,
        policyUpdates: true,
        systemMaintenance: false,
        companyAnnouncements: true,
        userPermissionChanges: true,
        reportGeneration: false
      },
      globalSettings: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        browserNotifications: true,
        notificationFrequency: 'immediate',
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      }
    };
  }

  // Get notification settings for a company
  async getNotificationSettings(companyId) {
    try {
      let settings = await NotificationSettings.findOne({ companyId });
      
      if (!settings) {
        // Create default settings if none exist
        settings = new NotificationSettings({ companyId, ...this.defaultSettings });
        await settings.save();
      }
      
      return settings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // Return default settings on error
      return { companyId, ...this.defaultSettings };
    }
  }

  // Check if a specific notification type is enabled
  async isNotificationEnabled(companyId, module, notificationType) {
    try {
      const settings = await this.getNotificationSettings(companyId);
      
      // Check global settings first
      if (!settings.globalSettings?.emailNotifications && 
          !settings.globalSettings?.pushNotifications && 
          !settings.globalSettings?.browserNotifications) {
        return false;
      }
      
      // Check quiet hours
      if (settings.globalSettings?.quietHours?.enabled) {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        const startTime = settings.globalSettings.quietHours.startTime;
        const endTime = settings.globalSettings.quietHours.endTime;
        
        if (this.isTimeInRange(currentTime, startTime, endTime)) {
          return false;
        }
      }
      
      // Check module and specific notification type
      return settings[module] && settings[module][notificationType] === true;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      // Default to enabled on error
      return true;
    }
  }

  // Check if current time is within quiet hours range
  isTimeInRange(current, start, end) {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    if (startMinutes <= endMinutes) {
      // Same day range
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  // Convert time string to minutes since midnight
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Send notification if enabled
  async sendNotificationIfEnabled(companyId, module, notificationType, notificationData) {
    try {
      const isEnabled = await this.isNotificationEnabled(companyId, module, notificationType);
      
      if (!isEnabled) {
        console.log(`Notification skipped - ${module}.${notificationType} is disabled for company ${companyId}`);
        return false;
      }

      const settings = await this.getNotificationSettings(companyId);
      
      // Get notification template
      const template = this.getNotificationTemplate(settings, notificationType);
      const message = this.parseTemplate(template, notificationData);
      
      // Send notification based on global settings
      const promises = [];
      
      if (settings.globalSettings?.emailNotifications) {
        promises.push(this.sendEmailNotification(notificationData.recipient, message, notificationData));
      }
      
      if (settings.globalSettings?.pushNotifications) {
        promises.push(this.sendPushNotification(notificationData.recipient, message, notificationData));
      }
      
      if (settings.globalSettings?.browserNotifications) {
        promises.push(this.sendBrowserNotification(notificationData.recipient, message, notificationData));
      }
      
      if (settings.globalSettings?.smsNotifications) {
        promises.push(this.sendSMSNotification(notificationData.recipient, message, notificationData));
      }
      
      await Promise.allSettled(promises);
      return true;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Get notification template
  getNotificationTemplate(settings, notificationType) {
    const templates = {
      application: 'Application submitted by {{employee_name}} for {{dates}}',
      approval: 'Your application from {{start_date}} to {{end_date}} has been approved',
      rejection: 'Your application from {{start_date}} to {{end_date}} has been rejected. Reason: {{reason}}',
      assignment: 'New task assigned: {{task_title}} - Due: {{due_date}}',
      completion: 'Task completed: {{task_title}} by {{employee_name}}',
      reminder: 'Reminder: {{subject}} - {{message}}',
      welcome: 'Welcome to {{company_name}}, {{employee_name}}!',
      clockIn: 'Clock in reminder for {{employee_name}}',
      clockOut: 'Clock out reminder for {{employee_name}}',
      holiday: 'Upcoming holiday: {{holiday_name}} on {{holiday_date}}',
      announcement: 'Company announcement: {{title}} - {{message}}'
    };
    
    return settings.templates?.[notificationType] || templates[notificationType] || '{{subject}}: {{message}}';
  }

  // Parse template with data
  parseTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Placeholder notification methods - implement based on your notification system
  async sendEmailNotification(recipient, message, data) {
    console.log(`📧 Email notification to ${recipient}: ${message}`);
    // Implement email sending logic here
  }

  async sendPushNotification(recipient, message, data) {
    console.log(`📱 Push notification to ${recipient}: ${message}`);
    // Implement push notification logic here
  }

  async sendBrowserNotification(recipient, message, data) {
    console.log(`🌐 Browser notification to ${recipient}: ${message}`);
    // Implement browser notification logic here
  }

  async sendSMSNotification(recipient, message, data) {
    console.log(`📲 SMS notification to ${recipient}: ${message}`);
    // Implement SMS notification logic here
  }

  // Batch notification for multiple recipients
  async sendBatchNotification(companyId, module, notificationType, recipients, notificationData) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendNotificationIfEnabled(
        companyId, 
        module, 
        notificationType, 
        { ...notificationData, recipient }
      );
      results.push({ recipient, sent: result });
    }
    
    return results;
  }

  // Quick helper methods for common notifications
  async notifyLeaveApplication(companyId, employeeName, leaveDates, recipients) {
    return this.sendBatchNotification(
      companyId,
      'leaveManagement',
      'application',
      recipients,
      {
        employee_name: employeeName,
        dates: leaveDates,
        subject: 'Leave Application',
        message: `Leave application submitted by ${employeeName} for ${leaveDates}`
      }
    );
  }

  async notifyLeaveApproval(companyId, recipient, startDate, endDate) {
    return this.sendNotificationIfEnabled(
      companyId,
      'leaveManagement',
      'approval',
      {
        recipient,
        start_date: startDate,
        end_date: endDate,
        subject: 'Leave Approved',
        message: `Your leave application from ${startDate} to ${endDate} has been approved`
      }
    );
  }

  async notifyTaskAssignment(companyId, recipient, taskTitle, dueDate) {
    return this.sendNotificationIfEnabled(
      companyId,
      'taskManagement',
      'assignment',
      {
        recipient,
        task_title: taskTitle,
        due_date: dueDate,
        subject: 'Task Assignment',
        message: `New task assigned: ${taskTitle} - Due: ${dueDate}`
      }
    );
  }

  async notifyAttendanceAlert(companyId, recipients, employeeName, alertType) {
    return this.sendBatchNotification(
      companyId,
      'attendanceManagement',
      'latePunchNotifications',
      recipients,
      {
        employee_name: employeeName,
        alert_type: alertType,
        subject: 'Attendance Alert',
        message: `Attendance alert: ${employeeName} - ${alertType}`
      }
    );
  }

  async notifyWFHApplication(companyId, employeeName, wfhDates, recipients) {
    return this.sendBatchNotification(
      companyId,
      'wfhManagement',
      'application',
      recipients,
      {
        employee_name: employeeName,
        wfh_dates: wfhDates,
        subject: 'WFH Application',
        message: `WFH application submitted by ${employeeName} for ${wfhDates}`
      }
    );
  }

  async notifyHolidayReminder(companyId, recipients, holidayName, holidayDate) {
    return this.sendBatchNotification(
      companyId,
      'holidayNotifications',
      'upcomingHolidays',
      recipients,
      {
        holiday_name: holidayName,
        holiday_date: holidayDate,
        subject: 'Holiday Reminder',
        message: `Upcoming holiday: ${holidayName} on ${holidayDate}`
      }
    );
  }

  async notifyOnboardingWelcome(companyId, recipient, employeeName, companyName) {
    return this.sendNotificationIfEnabled(
      companyId,
      'employeeOnboarding',
      'welcomeEmails',
      {
        recipient,
        employee_name: employeeName,
        company_name: companyName,
        subject: 'Welcome!',
        message: `Welcome to ${companyName}, ${employeeName}!`
      }
    );
  }
}

module.exports = new NotificationService();
