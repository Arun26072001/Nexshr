// Example integration of NotificationService into leave application routes
// This shows how to modify existing leave-app.js to use the new notification settings

const NotificationService = require('../services/NotificationService');

// Example 1: Enhanced leave application notification (replace existing make-know route)
const enhancedMakeKnowRoute = async (req, res) => {
  try {
    const leaveApps = await LeaveApplication.find({ 
      isDeleted: false, 
      status: "pending", 
      leaveType: { $nin: ["Unpaid Leave (LWP)"] } 
    })
      .populate({
        path: "employee",
        select: "FirstName LastName Email company",
        populate: [
          {
            path: "team",
            populate: [
              { path: "lead", select: "Email fcmToken" },
              { path: "head", select: "Email fcmToken" },
              { path: "manager", select: "Email fcmToken" },
              { path: "hr", select: "Email fcmToken" }
            ],
          },
          { path: "company", select: "logo CompanyName" }
        ],
      })
      .exec();

    for (const leave of leaveApps) {
      const emp = leave.employee;
      const teamData = emp?.team;
      const companyId = emp?.company?._id;

      if (!teamData || !companyId) continue;

      // Check if leave application notifications are enabled
      const isEnabled = await NotificationService.isNotificationEnabled(
        companyId, 
        'leaveManagement', 
        'application'
      );

      if (!isEnabled) {
        console.log(`Leave notifications disabled for company ${companyId}`);
        continue;
      }

      const formatFromDate = changeClientTimezoneDate(leave.fromDate).toLocaleString();
      const formatToDate = changeClientTimezoneDate(leave.toDate).toLocaleString();
      
      const members = [];
      for (const role of ["lead", "head", "manager", "hr"]) {
        for (const member of teamData[role]) {
          if (member && leave.approvers[role] === "pending") {
            members.push(member.Email);
          }
        }
      }

      // Use NotificationService instead of manual notification sending
      if (members.length > 0) {
        await NotificationService.notifyLeaveApplication(
          companyId,
          `${emp.FirstName} ${emp.LastName}`,
          `${formatFromDate} to ${formatToDate}`,
          members
        );
      }
    }

    res.status(200).json({ message: "Notifications sent successfully!" });
  } catch (error) {
    console.error("Error in enhanced make-know:", error);
    res.status(500).json({ error: "An error occurred while processing leave applications." });
  }
};

// Example 2: Leave approval notification
const notifyLeaveApproval = async (leaveApplication, approverEmail, companyId) => {
  try {
    const employee = leaveApplication.employee;
    const formatFromDate = changeClientTimezoneDate(leaveApplication.fromDate).toLocaleDateString();
    const formatToDate = changeClientTimezoneDate(leaveApplication.toDate).toLocaleDateString();

    // Check if approval notifications are enabled
    const isEnabled = await NotificationService.isNotificationEnabled(
      companyId, 
      'leaveManagement', 
      'approval'
    );

    if (isEnabled) {
      await NotificationService.notifyLeaveApproval(
        companyId,
        employee.Email,
        formatFromDate,
        formatToDate
      );
    }

    console.log(`Leave approval notification sent to ${employee.Email}`);
  } catch (error) {
    console.error('Error sending leave approval notification:', error);
  }
};

// Example 3: Leave rejection notification
const notifyLeaveRejection = async (leaveApplication, rejectionReason, companyId) => {
  try {
    const employee = leaveApplication.employee;
    const formatFromDate = changeClientTimezoneDate(leaveApplication.fromDate).toLocaleDateString();
    const formatToDate = changeClientTimezoneDate(leaveApplication.toDate).toLocaleDateString();

    // Check if rejection notifications are enabled
    const isEnabled = await NotificationService.isNotificationEnabled(
      companyId, 
      'leaveManagement', 
      'rejection'
    );

    if (isEnabled) {
      await NotificationService.sendNotificationIfEnabled(
        companyId,
        'leaveManagement',
        'rejection',
        {
          recipient: employee.Email,
          start_date: formatFromDate,
          end_date: formatToDate,
          reason: rejectionReason,
          employee_name: `${employee.FirstName} ${employee.LastName}`,
          subject: 'Leave Application Rejected',
          message: `Your leave application from ${formatFromDate} to ${formatToDate} has been rejected. Reason: ${rejectionReason}`
        }
      );
    }

    console.log(`Leave rejection notification sent to ${employee.Email}`);
  } catch (error) {
    console.error('Error sending leave rejection notification:', error);
  }
};

// Example 4: Leave reminder notifications (for pending approvals)
const sendLeaveReminders = async () => {
  try {
    const pendingLeaves = await LeaveApplication.find({
      status: 'pending',
      isDeleted: false,
      // Leaves pending for more than 24 hours
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).populate([
      { 
        path: 'employee', 
        select: 'FirstName LastName Email company',
        populate: { path: 'company', select: '_id CompanyName' }
      },
      {
        path: 'employee',
        populate: {
          path: 'team',
          populate: [
            { path: 'lead', select: 'Email' },
            { path: 'head', select: 'Email' },
            { path: 'manager', select: 'Email' },
            { path: 'hr', select: 'Email' }
          ]
        }
      }
    ]);

    for (const leave of pendingLeaves) {
      const companyId = leave.employee.company._id;
      const teamData = leave.employee.team;

      if (!teamData) continue;

      // Check if reminder notifications are enabled
      const isEnabled = await NotificationService.isNotificationEnabled(
        companyId, 
        'leaveManagement', 
        'reminders'
      );

      if (!isEnabled) continue;

      const approvers = [];
      for (const role of ['lead', 'head', 'manager', 'hr']) {
        if (leave.approvers[role] === 'pending' && teamData[role].length > 0) {
          approvers.push(...teamData[role].map(member => member.Email));
        }
      }

      if (approvers.length > 0) {
        const formatFromDate = changeClientTimezoneDate(leave.fromDate).toLocaleDateString();
        const formatToDate = changeClientTimezoneDate(leave.toDate).toLocaleDateString();

        await NotificationService.sendBatchNotification(
          companyId,
          'leaveManagement',
          'reminders',
          approvers,
          {
            subject: 'Leave Approval Reminder',
            message: `Reminder: ${leave.employee.FirstName} ${leave.employee.LastName}'s leave application from ${formatFromDate} to ${formatToDate} is still pending your approval.`,
            employee_name: `${leave.employee.FirstName} ${leave.employee.LastName}`,
            dates: `${formatFromDate} to ${formatToDate}`
          }
        );
      }
    }

    console.log('Leave reminder notifications processed successfully');
  } catch (error) {
    console.error('Error sending leave reminders:', error);
  }
};

// Example 5: Leave balance alerts
const sendLeaveBalanceAlerts = async () => {
  try {
    const employees = await Employee.find({
      isDeleted: false,
      // Find employees with low leave balance (less than 5 days)
      'typesOfLeaveRemainingDays.Annual Leave': { $lt: 5, $gte: 0 }
    }).populate('company', '_id CompanyName');

    for (const employee of employees) {
      const companyId = employee.company._id;

      // Check if balance alert notifications are enabled
      const isEnabled = await NotificationService.isNotificationEnabled(
        companyId, 
        'leaveManagement', 
        'balanceAlerts'
      );

      if (!isEnabled) continue;

      const remainingDays = employee.typesOfLeaveRemainingDays?.['Annual Leave'] || 0;

      await NotificationService.sendNotificationIfEnabled(
        companyId,
        'leaveManagement',
        'balanceAlerts',
        {
          recipient: employee.Email,
          subject: 'Low Leave Balance Alert',
          message: `Your annual leave balance is running low. You have ${remainingDays} days remaining.`,
          employee_name: `${employee.FirstName} ${employee.LastName}`,
          remaining_days: remainingDays
        }
      );
    }

    console.log('Leave balance alerts sent successfully');
  } catch (error) {
    console.error('Error sending leave balance alerts:', error);
  }
};

// Example 6: Integration in approval route
const approveLeaveWithNotification = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { approverRole } = req.body; // 'lead', 'head', 'manager', 'hr'
    
    const leave = await LeaveApplication.findById(leaveId)
      .populate('employee', 'FirstName LastName Email company')
      .populate('employee.company', '_id');

    if (!leave) {
      return res.status(404).json({ error: 'Leave application not found' });
    }

    const companyId = leave.employee.company._id;

    // Update leave status
    leave.approvers[approverRole] = 'approved';
    leave.status = 'approved'; // or check if all approvers have approved
    await leave.save();

    // Send approval notification
    await notifyLeaveApproval(leave, req.user.email, companyId);

    res.json({ message: 'Leave approved successfully', leave });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
};

// Example 7: Cron job setup for automated reminders
const scheduleNotificationJobs = () => {
  const cron = require('node-cron');
  
  // Send leave reminders every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily leave reminder job...');
    await sendLeaveReminders();
  });

  // Send leave balance alerts every Monday at 10 AM
  cron.schedule('0 10 * * 1', async () => {
    console.log('Running weekly leave balance alert job...');
    await sendLeaveBalanceAlerts();
  });

  console.log('Notification cron jobs scheduled successfully');
};

module.exports = {
  enhancedMakeKnowRoute,
  notifyLeaveApproval,
  notifyLeaveRejection,
  sendLeaveReminders,
  sendLeaveBalanceAlerts,
  approveLeaveWithNotification,
  scheduleNotificationJobs
};

/*
Usage Instructions:

1. Replace the existing /make-know route in leave-app.js:
   router.get("/make-know", enhancedMakeKnowRoute);

2. Use in leave approval routes:
   await notifyLeaveApproval(leaveApplication, approverEmail, companyId);

3. Use in leave rejection routes:
   await notifyLeaveRejection(leaveApplication, rejectionReason, companyId);

4. Set up cron jobs in your main app.js:
   const { scheduleNotificationJobs } = require('./examples/LeaveApplicationIntegration');
   scheduleNotificationJobs();

5. Benefits:
   - Respects user notification preferences
   - Supports quiet hours
   - Handles multiple notification channels (email, push, SMS)
   - Uses customizable templates
   - Provides detailed logging
   - Easy to extend for other modules
*/
