const mongoose = require("mongoose");

const NotificationSettingsSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Company", 
    required: true, 
    unique: true 
  },
  
  // Leave Management Notifications
  leaveManagement: {
    application: { type: Boolean, default: true },
    approval: { type: Boolean, default: true },
    rejection: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    approvalDeadlines: { type: Boolean, default: true },
    balanceAlerts: { type: Boolean, default: false }
  },

  // WFH Management Notifications
  wfhManagement: {
    application: { type: Boolean, default: true },
    approval: { type: Boolean, default: true },
    rejection: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    approvalDeadlines: { type: Boolean, default: true },
    teamLimitAlerts: { type: Boolean, default: true }
  },

  // Employee Onboarding Notifications
  employeeOnboarding: {
    welcomeEmails: { type: Boolean, default: true },
    credentialUpdates: { type: Boolean, default: true },
    documentReminders: { type: Boolean, default: true },
    onboardingProgress: { type: Boolean, default: true },
    completionNotifications: { type: Boolean, default: true },
    taskAssignments: { type: Boolean, default: true },
    birthday: {type: Boolean, default: true},
    workAnniversary: {type: Boolean, default: true}
  },

  // Attendance Management Notifications
  attendanceManagement: {
    latePunchNotifications: { type: Boolean, default: true },
    breakReminders: { type: Boolean, default: false },
    dailyReports: { type: Boolean, default: false },
    overtimeAlerts: { type: Boolean, default: true },
    clockInReminders: { type: Boolean, default: true },
    clockOutReminders: { type: Boolean, default: true },
    attendanceAnomalies: { type: Boolean, default: true },
    monthlyReports: { type: Boolean, default: false }
  },

  // Task Management Notifications
  taskManagement: {
    assignment: { type: Boolean, default: true },
    completion: { type: Boolean, default: true },
    commentNotifications: { type: Boolean, default: true },
    deadlineReminders: { type: Boolean, default: true },
    statusUpdates: { type: Boolean, default: true },
    overdueTasks: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: false }
  },

  // Holiday Notifications
  holidayNotifications: {
    holidayListCreation: { type: Boolean, default: true },
    holidayListUpdates: { type: Boolean, default: true },
    upcomingHolidays: { type: Boolean, default: true },
    holidayReminders: { type: Boolean, default: false },
    companyEvents: { type: Boolean, default: true }
  },

  // Administrative Notifications
  administrative: {
    timeScheduleChanges: { type: Boolean, default: true },
    annualLeaveRenewals: { type: Boolean, default: true },
    policyUpdates: { type: Boolean, default: true },
    systemMaintenance: { type: Boolean, default: false },
    companyAnnouncements: { type: Boolean, default: true },
    userPermissionChanges: { type: Boolean, default: true },
    reportGeneration: { type: Boolean, default: false }
  },

  // // Global Settings
  // globalSettings: {
  //   emailNotifications: { type: Boolean, default: true },
  //   pushNotifications: { type: Boolean, default: true },
  //   smsNotifications: { type: Boolean, default: false },
  //   browserNotifications: { type: Boolean, default: true },
  //   notificationFrequency: { 
  //     type: String, 
  //     enum: ["immediate", "hourly", "daily", "weekly"], 
  //     default: "immediate" 
  //   },
  //   quietHours: {
  //     enabled: { type: Boolean, default: false },
  //     startTime: { type: String, default: "22:00" },
  //     endTime: { type: String, default: "08:00" }
  //   }
  // },

  // // Notification Templates
  // templates: {
  //   leaveApplication: { type: String, default: "Leave application submitted by {{employee_name}} for {{leave_dates}}" },
  //   leaveApproval: { type: String, default: "Your leave application from {{start_date}} to {{end_date}} has been approved" },
  //   leaveRejection: { type: String, default: "Your leave application from {{start_date}} to {{end_date}} has been rejected. Reason: {{reason}}" },
  //   wfhApplication: { type: String, default: "WFH application submitted by {{employee_name}} for {{wfh_dates}}" },
  //   wfhApproval: { type: String, default: "Your WFH application for {{wfh_date}} has been approved" },
  //   taskAssignment: { type: String, default: "New task assigned: {{task_title}} - Due: {{due_date}}" },
  //   attendanceAlert: { type: String, default: "Attendance alert: {{employee_name}} - {{alert_type}}" },
  //   holidayReminder: { type: String, default: "Upcoming holiday: {{holiday_name}} on {{holiday_date}}" }
  // }

}, { timestamps: true });

// // Create indexes for better performance
// NotificationSettingsSchema.index({ companyId: 1 });

const NotificationSettings = mongoose.model("NotificationSettings", NotificationSettingsSchema);

module.exports = NotificationSettings;
