# Notification Settings System

A comprehensive notification management system for NexHR that allows companies to configure notification preferences across different modules and delivery channels.

## 🌟 Features

- **Module-wise Control**: Configure notifications for different HR modules (Leave, WFH, Attendance, etc.)
- **Multiple Channels**: Support for Email, Push, SMS, and Browser notifications
- **Quiet Hours**: Automatically disable notifications during specified time periods
- **Template Customization**: Customizable notification templates with variable substitution
- **Bulk Operations**: Enable/disable all notifications at once or by module
- **Real-time UI**: Modern Material-UI interface with real-time feedback
- **API Integration**: RESTful API with proper authentication and authorization

## 📁 File Structure

```
nexhr_backend_org/
├── models/
│   └── NotificationSettingsModel.js         # MongoDB schema
├── routes/
│   └── notification-settings.js             # API endpoints
├── services/
│   └── NotificationService.js              # Business logic service
└── examples/
    └── LeaveApplicationIntegration.js       # Usage examples

nexr_frontend_org/
└── src/components/Settings/
    └── NotificationSettings.jsx             # React component
```

## 🗃️ Database Schema

### NotificationSettings Model

```javascript
{
  companyId: ObjectId,                        // Reference to Company

  // Module-specific settings
  leaveManagement: {
    application: Boolean,                     // New leave applications
    approval: Boolean,                        // Leave approvals
    rejection: Boolean,                       // Leave rejections
    reminders: Boolean,                       // Approval reminders
    applicationUpdates: Boolean,              // Application modifications
    approvalDeadlines: Boolean,               // Deadline warnings
    balanceAlerts: Boolean                    // Low balance alerts
  },

  wfhManagement: {
    application: Boolean,
    approval: Boolean,
    rejection: Boolean,
    reminders: Boolean,
    applicationUpdates: Boolean,
    approvalDeadlines: Boolean,
    teamLimitAlerts: Boolean                  // Team WFH limit warnings
  },

  employeeManagement: {
    welcomeEmails: Boolean,
    credentialUpdates: Boolean,
    documentReminders: Boolean,
    onboardingProgress: Boolean,
    completionNotifications: Boolean,
    taskAssignments: Boolean
  },

  attendanceManagement: {
    latePunchNotifications: Boolean,
    breakReminders: Boolean,
    dailyReports: Boolean,
    overtimeAlerts: Boolean,
    clockInReminders: Boolean,
    clockOutReminders: Boolean,
    attendanceAnomalies: Boolean,
    monthlyReports: Boolean
  },

  taskManagement: {
    assignment: Boolean,
    completion: Boolean,
    commentNotifications: Boolean,
    deadlineReminders: Boolean,
    statusUpdates: Boolean,
    overdueTasks: Boolean,
    projectUpdates: Boolean
  },

  holidayNotifications: {
    holidayListCreation: Boolean,
    holidayListUpdates: Boolean,
    upcomingHolidays: Boolean,
    holidayReminders: Boolean,
    companyEvents: Boolean
  },

  administrative: {
    timeScheduleChanges: Boolean,
    annualLeaveRenewals: Boolean,
    policyUpdates: Boolean,
    systemMaintenance: Boolean,
    companyAnnouncements: Boolean,
    userPermissionChanges: Boolean,
    reportGeneration: Boolean
  },

  // Global settings
  globalSettings: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    smsNotifications: Boolean,
    browserNotifications: Boolean,
    notificationFrequency: String,            // immediate, hourly, daily, weekly
    quietHours: {
      enabled: Boolean,
      startTime: String,                      // "22:00"
      endTime: String                         // "08:00"
    }
  },

  // Customizable templates
  templates: {
    leaveApplication: String,
    leaveApproval: String,
    leaveRejection: String,
    // ... more templates
  }
}
```

## 🛠️ API Endpoints

### Base URL: `/api/notification-settings`

| Method | Endpoint       | Description                       | Auth Required |
| ------ | -------------- | --------------------------------- | ------------- |
| GET    | `/`            | Get company notification settings | ✅            |
| PUT    | `/`            | Update all notification settings  | ✅ (Admin/HR) |
| PATCH  | `/:module`     | Update specific module settings   | ✅ (Admin/HR) |
| GET    | `/:module`     | Get specific module settings      | ✅            |
| POST   | `/reset`       | Reset to default settings         | ✅ (Admin/HR) |
| POST   | `/bulk-toggle` | Enable/disable all notifications  | ✅ (Admin/HR) |

### Request Examples

#### Get Settings

```javascript
GET /api/notification-settings
Headers: { Authorization: "Bearer <token>" }

Response:
{
  "success": true,
  "data": {
    "companyId": "...",
    "leaveManagement": { ... },
    "globalSettings": { ... }
  }
}
```

#### Update Module Settings

```javascript
PATCH /api/notification-settings/leaveManagement
Headers: { Authorization: "Bearer <token>" }
Body: {
  "application": true,
  "approval": false,
  "rejection": true
}

Response:
{
  "success": true,
  "message": "leaveManagement settings updated successfully",
  "data": { ... }
}
```

#### Bulk Toggle

```javascript
POST /api/notification-settings/bulk-toggle
Headers: { Authorization: "Bearer <token>" }
Body: {
  "enabled": false,
  "modules": ["leaveManagement", "wfhManagement"] // optional
}
```

## 🎛️ Frontend Component

### NotificationSettings.jsx

A comprehensive React component with Material-UI providing:

- **Accordion-based UI** for each module
- **Master toggle** for all notifications
- **Individual toggles** for each notification type
- **Global settings panel** for delivery preferences
- **Real-time updates** with loading states
- **Success/error feedback** with toast notifications

### Key Features:

- Color-coded modules with icons
- Enabled/total notification counters
- Quick module enable/disable buttons
- Global settings for delivery channels
- Notification frequency selection
- Quiet hours configuration

## 🔧 NotificationService

A centralized service class for managing notifications with settings awareness.

### Key Methods:

#### `isNotificationEnabled(companyId, module, notificationType)`

Checks if a specific notification type is enabled, considering:

- Module-specific settings
- Global delivery channel settings
- Quiet hours restrictions

#### `sendNotificationIfEnabled(companyId, module, notificationType, data)`

Sends notifications only if enabled, handling:

- Template parsing
- Multiple delivery channels
- Error handling

#### Helper Methods:

```javascript
// Quick notification methods
await NotificationService.notifyLeaveApplication(
  companyId,
  employeeName,
  dates,
  recipients
);
await NotificationService.notifyLeaveApproval(
  companyId,
  recipient,
  startDate,
  endDate
);
await NotificationService.notifyTaskAssignment(
  companyId,
  recipient,
  taskTitle,
  dueDate
);
await NotificationService.notifyAttendanceAlert(
  companyId,
  recipients,
  employeeName,
  alertType
);
```

## 📋 Integration Guide

### 1. Basic Integration

Replace existing notification code:

```javascript
// OLD: Direct notification sending
await sendMail({...});
await sendPushNotification({...});

// NEW: Settings-aware notification
await NotificationService.notifyLeaveApplication(
  companyId,
  employeeName,
  leaveDates,
  recipients
);
```

### 2. Advanced Integration

```javascript
const NotificationService = require("../services/NotificationService");

// Check before sending
const isEnabled = await NotificationService.isNotificationEnabled(
  companyId,
  "leaveManagement",
  "application"
);

if (isEnabled) {
  // Send notification
}
```

### 3. Custom Notifications

```javascript
await NotificationService.sendNotificationIfEnabled(
  companyId,
  "taskManagement",
  "assignment",
  {
    recipient: "user@example.com",
    task_title: "Complete Report",
    due_date: "2024-01-15",
    employee_name: "John Doe",
    subject: "New Task Assignment",
    message: "You have been assigned a new task: Complete Report",
  }
);
```

## 🚀 Usage Examples

### Leave Application Integration

```javascript
// In leave-app.js
const NotificationService = require('../services/NotificationService');

// Enhanced leave application notification
router.get("/make-know", async (req, res) => {
  try {
    const leaveApps = await LeaveApplication.find({...});

    for (const leave of leaveApps) {
      const companyId = leave.employee.company._id;

      // Check if notifications are enabled
      const isEnabled = await NotificationService.isNotificationEnabled(
        companyId,
        'leaveManagement',
        'application'
      );

      if (isEnabled) {
        await NotificationService.notifyLeaveApplication(
          companyId,
          `${emp.FirstName} ${emp.LastName}`,
          `${formatFromDate} to ${formatToDate}`,
          approverEmails
        );
      }
    }

    res.json({ message: "Notifications processed!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Automated Reminders

```javascript
const cron = require("node-cron");

// Daily reminder job
cron.schedule("0 9 * * *", async () => {
  console.log("Running notification reminders...");

  const pendingLeaves = await LeaveApplication.find({
    status: "pending",
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  for (const leave of pendingLeaves) {
    await NotificationService.sendNotificationIfEnabled(
      leave.employee.company._id,
      "leaveManagement",
      "reminders",
      {
        recipient: approverEmail,
        subject: "Leave Approval Reminder",
        message: `Reminder: ${leave.employee.name}'s leave application is pending approval.`,
        employee_name: leave.employee.name,
        dates: formatDates(leave.fromDate, leave.toDate),
      }
    );
  }
});
```

## 🎨 UI Screenshots & Features

### Main Interface

- **Header**: Title with refresh and reset buttons
- **Master Control**: Global on/off toggle with description
- **Module Accordions**: Expandable sections for each HR module
- **Status Indicators**: Chips showing enabled/total counts
- **Quick Actions**: Module-level enable/disable buttons

### Global Settings Panel

- **Delivery Channels**: Email, Push, SMS, Browser toggles
- **Frequency**: Dropdown for notification timing
- **Quiet Hours**: Toggle and time picker for do-not-disturb periods

### Responsive Design

- **Mobile-friendly**: Collapsible accordions and responsive grid
- **Loading States**: Progress indicators during API calls
- **Error Handling**: Toast notifications for success/failure

## 🔒 Security & Permissions

- **Authentication**: All routes require valid JWT tokens
- **Authorization**: Admin/HR roles for modification, broader access for viewing
- **Company Isolation**: Settings are company-specific and isolated
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Recommended for production deployments

## 📊 Monitoring & Logging

The system provides detailed logging for:

- Notification delivery attempts
- Settings changes and who made them
- Failed notification attempts with reasons
- Performance metrics for notification processing

Example logs:

```
[INFO] Notification sent: Leave application from John Doe (company: ABC123)
[WARN] Notification skipped: leaveManagement.reminders disabled (company: ABC123)
[ERROR] Failed to send push notification: Invalid FCM token (user: john@example.com)
```

## 🚀 Deployment Checklist

### Backend

- [ ] Deploy NotificationSettingsModel.js
- [ ] Deploy notification-settings.js routes
- [ ] Deploy NotificationService.js
- [ ] Register routes in app.js
- [ ] Set up database indexes
- [ ] Configure cron jobs (if using automated reminders)

### Frontend

- [ ] Deploy NotificationSettings.jsx component
- [ ] Update Settings.jsx to include new tab
- [ ] Test UI responsiveness
- [ ] Verify API connectivity

### Testing

- [ ] Unit tests for NotificationService
- [ ] API endpoint testing
- [ ] UI component testing
- [ ] Integration testing with existing notification flows
- [ ] Performance testing with large datasets

## 🔮 Future Enhancements

- **User-level Preferences**: Individual user notification overrides
- **Advanced Templates**: Rich HTML templates with drag-drop editor
- **Analytics Dashboard**: Notification delivery statistics and metrics
- **A/B Testing**: Different notification strategies comparison
- **Integration APIs**: Slack, Microsoft Teams, etc.
- **Mobile App**: Deep linking and rich notifications
- **AI Optimization**: Smart delivery timing based on user behavior

## 🤝 Contributing

When extending the notification system:

1. **Add new modules**: Update the schema, service, and UI
2. **New notification types**: Add to relevant modules in the schema
3. **New delivery channels**: Implement in NotificationService
4. **UI improvements**: Follow Material-UI patterns
5. **Testing**: Include unit and integration tests

## 📞 Support

For issues or questions:

- Check existing notification flows in `routes/` directory
- Review integration examples in `examples/` directory
- Test API endpoints with provided examples
- Check browser console for frontend errors
- Monitor server logs for backend issues

---

**Note**: This system is designed to be backward-compatible. Existing notification code will continue to work, but new implementations should use the NotificationService for settings awareness.
