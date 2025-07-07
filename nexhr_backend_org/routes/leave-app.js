const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const { toZonedTime } = require('date-fns-tz');
const { format } = require("date-fns");
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyEmployee, verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdminHREmployee, verifyTeamHigherAuthority, verifyAdminHrNetworkAdmin } = require('../auth/authMiddleware');
const { Team } = require('../models/TeamModel');
const { upload } = require('./imgUpload');
const sendMail = require("./mailSender");
const { getDayDifference, mailContent, formatLeaveData, formatDate, getValidLeaveDays, sumLeaveDays, changeClientTimezoneDate, errorCollector } = require('../Reuseable_functions/reusableFunction');
const { Task } = require('../models/TaskModel');
const { sendPushNotification } = require('../auth/PushNotification');
const { Holiday } = require('../models/HolidayModel');
const { TimePattern } = require('../models/TimePatternModel');

// Helper function to generate leave request email content
function generateLeaveEmail(empData, fromDateValue, toDateValue, reasonForLeave, leaveType, deadLineTask = []) {
  const fromDate = changeClientTimezoneDate(fromDateValue);
  const toDate = changeClientTimezoneDate(toDateValue);

  const formattedFromDate = `${fromDate.toLocaleString("default", { month: "long" })} ${fromDate.getDate()}, ${fromDate.toLocaleTimeString()}`;
  const formattedToDate = `${toDate.toLocaleString("default", { month: "long" })} ${toDate.getDate()}, ${toDate.toLocaleTimeString()}`;

  const deadlineTasksHtml = deadLineTask.length
    ? `
      <h3 style="text-align:center;margin: 10px 0;">${empData.FirstName} ${empData.LastName} has ${deadLineTask.length} deadline task(s)</h3>
      ${deadLineTask
      .map(
        (task) =>
          `<p><b>${task.title}</b> (${task.status}): (${formatDate(task.from)} - ${formatDate(task.to)})</p>`
      )
      .join("")}
    `
    : "";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${empData.company.CompanyName}- Leave Application</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
                box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">
      <!-- Header -->
      <div style="text-align: center; padding: 20px;">
        <img src="${empData.company.logo}"
             alt="Company Logo" style="max-width: 100px;" />
        <h1 style="font-size: 20px; margin: 10px 0;">
          Leave Application (${leaveType} from ${formattedFromDate} to ${formattedToDate})
        </h1>
        <h2 style="font-size: 16px; margin: 5px 0; color: #555;">
          Submitted by: ${empData.FirstName} ${empData.LastName}
        </h2>
      </div>

      ${deadlineTasksHtml}

      <!-- Content -->
      <div style="margin: 20px 0; padding: 10px;">
        <p style="font-size: 14px; margin: 10px 0;"><strong>Reason for Leave:</strong> ${reasonForLeave}</p>
        <p style="font-size: 14px; margin: 10px 0;">
          Please let me know if any further information is required. 
          I kindly request you to consider and approve this request.
        </p>
        <p style="font-size: 14px; margin: 10px 0;">
          Thank you for your time and support.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid #ddd; margin-top: 20px;">
        <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} NexsHR. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

leaveApp.get("/check-permissions/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const leaveData = await LeaveApplication.find({
      employee: req.params.id,
      leaveType: "Permission Leave",
      fromDate: { $lte: endOfMonth },
      toDate: { $gte: startOfMonth },
      status: "approved"
    })

    // check employee of permissions
    if (leaveData.length >= 2) {
      return res.send({ type: "Permission taken" })
    } else {
      return res.send({ type: "Permission is remain" })
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("error in check emp's permissions", error);
    return res.status(500).send({ error: error.message })
  }
})

leaveApp.get("/make-know", async (req, res) => {
  try {
    const leaveApps = await LeaveApplication.find({ status: "pending", leaveType: { $nin: ["Unpaid Leave (LWP)"] } })
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

      if (!teamData) continue;
      const formatFromDate = changeClientTimezoneDate(leave.fromDate).toLocaleString();
      const formatToDate = changeClientTimezoneDate(leave.toDate).toLocaleString();
      const Subject = "Leave Application Reminder";
      const message = `${emp.FirstName} has applied for leave from ${formatFromDate} to ${formatToDate} due to ${leave.reasonForLeave.replace(/<\/?[^>]+(>|$)/g, '')}. Please respond to this request.`;

      const members = [];

      for (const role of ["lead", "head", "manager", "hr"]) {
        for (const member of teamData[role]) {
          if (member && leave.approvers[role] === "pending") {
            members.push(member);
            // html content
            const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${leave?.employee?.company?.CompanyName || "Webnexs"}</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; padding: 20px;">
                <img src="${leave?.employee?.company?.logo}" alt="Logo" style="max-width: 100px;" />
                <h1 style="margin: 0;">${leave.employee.FirstName} ${leave.employee.LastName} has applied for leave From ${formatFromDate} To ${formatToDate}</h1>
              </div>
              <div style="margin: 20px 0;">
                <p>Hi all,</p>
                <p>I have applied for leave from ${formatFromDate} to ${formatToDate} due to ${leave.reasonForLeave}. Please respond to this request.</p>
                <p>Thank you!</p>
              </div>
            </div>
          </body>
        </html>
      `;

            // Email
            await sendMail({
              From: `<${emp.Email}> (Nexshr)`,
              To: member.Email,
              Subject,
              HtmlBody: htmlContent,
            });

            // Notification
            const notification = {
              company: emp?.company?._id,
              title: Subject,
              message,
            };

            const fullMember = await Employee.findById(member._id, "notifications");
            if (fullMember) {
              fullMember.notifications.push(notification);
              await fullMember.save();
            }

            // Push notification
            if (member.fcmToken) {
              await sendPushNotification({
                token: member.fcmToken,
                title: notification.title,
                body: notification.message,
                // company: emp.company
              });
            }
          }
        }
      }

      // Logging
      const mailList = members.map(m => m.Email);
      console.log(`Notifications sent to: ${mailList.join(", ")}`);
    }

    res.status(200).json({ message: "Notifications sent successfully!" });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error in /make-know:", error);
    res.status(500).json({ error: "An error occurred while processing leave applications." });
  }
});

// get employee of all leave application From annualLeaveYearStart date
leaveApp.get("/emp/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { empId } = req.params;
    const { daterangeValue } = req.query;

    // Fetch employee data with necessary fields
    let emp = await Employee.findById(empId,
      "annualLeaveYearStart position FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays team profile workingTimePattern"
    ).populate([
      { path: "workingTimePattern", select: "WeeklyDays" },
      { path: "position", select: "PositionName" },
      { path: "team", populate: { path: "employees", select: "FirstName LastName Email phone" } }
    ]).lean();

    if (!emp) return res.status(404).json({ message: "Employee not found!" });

    // Define date range for leave filtering
    let startDate, endDate;
    if (Array.isArray(daterangeValue) && daterangeValue.length === 2) {
      [startDate, endDate] = daterangeValue.map(date => new Date(date));
    } else {
      const now = new Date();
      const annualStart = emp.annualLeaveYearStart ? new Date(emp.annualLeaveYearStart) : new Date(now.getDate(1));
      startDate = new Date(now.getFullYear(), annualStart.getMonth(), annualStart.getDate());
      endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1, 23, 59, 59, 999);
    }

    const today = new Date();
    const filterLeaves = { fromDate: { $lte: today }, toDate: { $gte: today }, status: "approved" };

    // **Parallel Data Fetching**
    let [leaveApplications, peopleOnLeave, team] = await Promise.all([
      LeaveApplication.find({
        employee: empId,
        fromDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).populate("employee", "FirstName LastName").lean(),
      LeaveApplication.find(filterLeaves).populate("employee", "FirstName LastName profile").lean(),
      Team.findOne({ employees: empId }, "employees").lean()
    ]);

    // change reason for leave as actual string
    leaveApplications = leaveApplications.map((leave) => ({
      ...leave,
      // tag replacer
      reasonForLeave: leave.reasonForLeave.replace(/<\/?[^>]+(>|$)/g, '')
    }))

    // Fetch team members' leaves only if team exists
    const peopleLeaveOnMonth = team
      ? await LeaveApplication.find({
        employee: { $in: team.employees },
        fromDate: { $lte: endDate },
        toDate: { $gte: startDate },
        leaveType: { $ne: "Permission Leave" },
        status: "approved"
      }).lean()
      : [];

    // filter current month of permissions and unpaid leave
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthOfLeaves = leaveApplications.filter((leave) => {
      const fromDate = new Date(leave.fromDate);
      return currentMonth === fromDate.getMonth() && fromDate.getFullYear() === currentYear;
    })
    const Permission = currentMonthOfLeaves.filter((leave) => leave.leaveType.includes("Permission")).length;
    const UnpaidLeave = leaveApplications.filter((leave) => leave.leaveType.includes("Unpaid")).length;
    emp = {
      ...emp,
      typesOfLeaveCount: {
        ...emp.typesOfLeaveCount,
        ["Unpaid" + " " + "Leave (LWP)"]: UnpaidLeave
      },
      typesOfLeaveRemainingDays: {
        ...emp.typesOfLeaveRemainingDays,
        ["Permission" + " " + "Leave"]: Permission
      }
    }
    // Helper function to format leave data
    const changeActualImgData = (leave) => ({
      ...leave,
      prescription: leave.prescription ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}` : null
    });
    let actualLeaveApps = [];
    const yearHolidays = await Holiday.findOne({ currentYear: new Date().getFullYear() });
    leaveApplications.map((leave) => {
      actualLeaveApps.push(...getValidLeaveDays(yearHolidays?.holidays, emp.workingTimePattern.WeeklyDays, leave.fromDate, leave.toDate))
    })

    res.json({
      employee: emp,
      leaveApplications: leaveApplications.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)).map(changeActualImgData),
      peopleOnLeave,
      peopleLeaveOnMonth: peopleLeaveOnMonth.map(changeActualImgData),
      calendarLeaveApps: actualLeaveApps
    });

  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching employee data:", err);
    res.status(500).json({ message: "Internal server error", details: err.message });
  }
});

leaveApp.get("/hr", verifyHR, async (req, res) => {
  try {
    // Fetch employee IDs with Account: 3
    const empIds = await Employee.find({ Account: 3 }, "_id");

    // Check if any employees are found
    if (empIds.length === 0) {
      return res.status(203).send({
        message: "No employees with Account type 3 found."
      });
    }

    // Fetch leave requests for these employees
    const leaveReqs = await Employee.find({ _id: { $in: empIds } }, "_id FirstName LastName leaveApplication")
      .populate({
        path: "leaveApplication",
        populate: { path: "employee", select: "_id FirstName LastName profile" },
      }).lean().exec();

    // Check if there are any leave requests
    if (leaveReqs.length === 0) {
      return res.status(203).send({
        message: "No leave requests in DB"
      });
    }

    // Send the leave requests
    let empLeaveReqs = leaveReqs
      .map((req) => req.leaveApplication)
      .flat()
      .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
    empLeaveReqs = empLeaveReqs.filter((leave) => !["Permission Leave", "permission", "Unpaid Leave (LWP)"].includes(leave.leaveType))
    empLeaveReqs = empLeaveReqs.map(formatLeaveData)
    res.send(empLeaveReqs);
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching leave requests:", err);
    res.status(500).send({ message: "Internal Server Error", details: err.message });
  }
});

leaveApp.get("/unpaid", verifyAdminHR, async (req, res) => {
  try {
    const daterangeValue = req.query?.daterangeValue;
    const now = new Date();
    // get dateRange value or current month range value
    const [startOfMonth, endOfMonth] = daterangeValue
      ? [new Date(daterangeValue[0]), new Date(daterangeValue[1])]
      : [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
    // fetching unpaid leave applications
    const pendingRequests = await LeaveApplication.find({
      fromDate: { $lte: endOfMonth },
      toDate: { $gte: startOfMonth },
      status: "pending"
    }).populate("employee", "FirstName LastName profile").exec();
    const unpaidRequests = pendingRequests.filter((leave) => leave?.leaveType?.toLowerCase().includes("unpaid"))
    const arrangeLeave = unpaidRequests.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
    return res.send(arrangeLeave);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.log("error in fetch unpaid leave", error);
    return res.status(500).send({ error: error.message })
  }
})

leaveApp.get("/team/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    const now = new Date(); // added missing `now`
    const { daterangeValue, who } = req.query;

    // get dateRange value or current month range value
    const [startOfMonth, endOfMonth] = daterangeValue
      ? [new Date(daterangeValue[0]), new Date(daterangeValue[1])]
      : [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 2, 0)];

    // Find team where the current user is a lead/head/etc.
    const teams = await Team.find({ [who]: req.params.id }).exec();

    if (!teams.length) {
      return res.status(404).json({ error: "You are not lead in any team" });
    }

    let employees = [];
    teams.map((team) => employees.push(...team.employees))

    function filterUniqeData(emps) {
      const setValues = new Set();
      emps.map((emp) => setValues.add(JSON.stringify(emp)))
      return Array.from(setValues).map((emp) => JSON.parse(emp))
    }
    const uniqueEmps = filterUniqeData(employees);

    // Fetch team members' basic info
    const colleagues = await Employee.find(
      { _id: { $in: uniqueEmps } },
      "FirstName LastName Email phone profile"
    ).lean();

    // Fetch leave applications within the date range
    let teamLeaves = await LeaveApplication.find({
      employee: { $in: uniqueEmps },
      leaveType: { $nin: ["Unpaid Leave (LWP)"] },
      $or: [
        {
          fromDate: { $lte: endOfMonth },
          toDate: { $gte: startOfMonth }
        }
      ]
    })
      .populate("employee", "FirstName LastName profile")
      .lean(); // lean = returns plain JS objects, faster

    // Map prescription URLs
    teamLeaves = teamLeaves.map(formatLeaveData)
    // filter leave from unpaid and permission
    teamLeaves.filter((leave) => !["Permission Leave", "permission", "Unpaid Leave (LWP)"].includes(leave.leaveType))

    // Sort by fromDate descending
    teamLeaves.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));

    const nowTime = new Date().getTime();
    const approvedLeave = teamLeaves.filter(l => l.status === "approved");
    const pendingLeave = teamLeaves.filter(l => l.status === "pending");
    const upComingLeave = approvedLeave.filter(l => new Date(l.fromDate).getTime() > nowTime);
    const peoplesOnLeave = approvedLeave.filter(l => {
      const from = new Date(l.fromDate).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      return from === today;
    });
    const takenLeave = approvedLeave.filter(l => new Date(l.fromDate).getTime() < nowTime)

    const [
      approvedLeaveDays,
      pendingLeaveDays,
      upComingLeaveDays,
      takenLeaveDays,
    ] = await Promise.all([
      sumLeaveDays(approvedLeave),
      sumLeaveDays(pendingLeave),
      sumLeaveDays(upComingLeave),
      sumLeaveDays(takenLeave),
    ]);

    res.json({
      leaveData: teamLeaves,
      pendingLeave: pendingLeaveDays,
      upComingLeave: upComingLeaveDays,
      approvedLeave: approvedLeaveDays,
      peoplesOnLeave,
      takenLeave: takenLeaveDays,
      colleagues
    });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error in /team/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

leaveApp.get("/all/emp", verifyAdminHR, async (req, res) => {
  try {

    const filterByAccount = req.query.isHr ? true : false;

    // Fetch leave data for employees with Account 3
    const employeesLeaveData = await Employee.find(filterByAccount ? { Account: 3 } : {}, "_id FirstName LastName profile")
      .populate({
        path: "leaveApplication",
        populate: { path: "employee", select: "FirstName LastName" }
      });
    // Flatten leaveApplication data
    let leaveData = employeesLeaveData.map(data => data.leaveApplication).flat();
    leaveData = leaveData.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
    leaveData = leaveData.map(formatLeaveData)

    res.send({
      leaveData
    });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching leave data:", err);
    res.status(500).send({ error: err.message });
  }
})

leaveApp.get("/people-on-leave", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

  try {
    const leaveData = await LeaveApplication.find({
      fromDate: { $lte: endOfDay },
      toDate: { $gte: startOfDay },
      leaveType: { $nin: ["Permission", "Permission Leave", "permission"] },
      status: "approved"
    }, "fromDate toDate status leaveType periodOfLeave")
      .populate({
        path: "employee",
        select: "FirstName LastName profile",
        populate: {
          path: "team",
          select: "teamName"
        }
      }).lean().exec();

    return res.status(200).send(leaveData);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message });
  }
});

leaveApp.get("/all/team/:id", verifyEmployee, async (req, res) => {
  try {
    const who = req.query.isLead ? "lead" : "head"
    const team = await Team.findOne({ [who]: req.params.id }).exec();
    if (!team) {
      return res.status(404).send({ error: "You are not lead in any team" })
    } else {
      const { employees } = team;
      let teamLeaves = await LeaveApplication.find({
        employee: { $in: employees },
      })
        .populate({
          path: "employee",
          select: "FirstName LastName profile"
        });
      teamLeaves = teamLeaves.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
      res.send({ leaveData: teamLeaves });
    }
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ error: error.message })
  }
});

// get leave application by id
leaveApp.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const leaveReq = await LeaveApplication.findById(req.params.id);

    if (!leaveReq) {
      return res.status(404).send({ message: "Leave application not found" }); // Changed To 404 for "not found"
    }

    // Construct the prescription URL if the prescription field exists
    const prescriptionUrl = leaveReq.prescription
      ? `${process.env.REACT_APP_API_URL}/uploads/${leaveReq.prescription}`
      : null;

    // Create the updated response object
    const updatedLeaveData = {
      ...leaveReq.toObject(), // Convert Mongoose document To plain object
      prescription: prescriptionUrl,
    };

    res.status(200).send(updatedLeaveData); // Explicitly send a 200 response
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching leave application:", err);

    res.status(500).send({
      message: "Internal server error",
      error: err.message, // Provide more details about the error
    });
  }
});

// get employee of leave data
leaveApp.get("/date-range/management/:whoIs", verifyAdminHrNetworkAdmin, async (req, res) => {
  const now = new Date();
  let startOfMonth, endOfMonth;

  if (req.query?.daterangeValue) {
    [startOfMonth, endOfMonth] = req.query.daterangeValue.map(date => new Date(date));
    endOfMonth.setHours(23, 59, 59, 999); // Include full last day
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  try {
    let filterObj = {};
    if (req.params.whoIs === "hr") {
      filterObj = {
        Account: 3
      }
    }
    const employeesLeaveData = await Employee.find(filterObj, "_id FirstName LastName profile leaveApplication")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $lte: endOfMonth },
          toDate: { $gte: startOfMonth },
          leaveType: { $nin: ["Unpaid Leave (LWP)"] }
        },
        populate: [
          { path: "employee", select: "FirstName LastName Email profile" },
          { path: "coverBy", select: "FirstName LastName Email profile" }
        ]
      });

    let leaveData = employeesLeaveData
      .flatMap(emp => emp.leaveApplication) // Flatten leave data
      .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))
      .map(leave => ({
        ...leave.toObject(),
        reasonForLeave: leave.reasonForLeave.replace(/<\/?[^>]+(>|$)/g, ''),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }));

    const approvedLeave = leaveData.filter(leave => leave.status === "approved");
    const pendingLeave = leaveData.filter(leave => leave.status === "pending");
    const upcomingLeave = leaveData.filter(leave => new Date(leave.fromDate) > now);
    const peopleOnLeave = approvedLeave.filter(leave =>
      new Date(leave.fromDate).toDateString() === now.toDateString()
    );
    const [upComingLeaveDays, pendingLeaveDays, approvedLeaveDays] = await Promise.all([
      sumLeaveDays(upcomingLeave),
      sumLeaveDays(pendingLeave),
      sumLeaveDays(approvedLeave)
    ])

    res.send({
      leaveData,
      approvedLeave: approvedLeaveDays,
      leaveInHours: approvedLeaveDays * 9,
      peopleOnLeave,
      pendingLeave: pendingLeaveDays,
      upcomingLeave: upComingLeaveDays
    });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching leave data:", error);
    res.status(500).send({ error: "An error occurred while fetching leave data." });
  }
});

leaveApp.get("/date-range/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  const now = new Date();
  let startOfMonth, endOfMonth;

  if (req.query?.daterangeValue) {
    startOfMonth = new Date(req.query.daterangeValue[0]);
    endOfMonth = new Date(req.query.daterangeValue[1]);
    endOfMonth.setHours(23, 59, 59, 999); // Include the full last day
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  try {
    // const employeeLeaveData = await Employee.findById(req.params.empId, "_id FirstName LastName profile leaveApplication")
    //   .populate({
    //     path: "leaveApplication",
    //     match: {
    //       fromDate: { $lte: endOfMonth },
    //       toDate: { $gte: startOfMonth }
    //     },
    //     populate: [
    //       { path: "employee", select: "FirstName LastName Email profile" },
    //       { path: "coverBy", select: "FirstName LastName Email profile" }
    //     ]
    //   });
    const employeeLeaveData = await LeaveApplication.find({ employee: req.params.empId, fromDate: { $lte: endOfMonth }, toDate: { $gte: startOfMonth } })
      .populate([
        { path: "employee", select: "FirstName LastName Email profile" },
        { path: "coverBy", select: "FirstName LastName Email profile" }
      ]).lean().exec();

    if (!employeeLeaveData || !employeeLeaveData.length) {
      return res.send({
        leaveData: [],
        approvedLeave: 0,
        peopleOnLeave: 0,
        pendingLeave: 0,
        upcomingLeave: 0,
        leaveInHours: 0
      });
    }

    const leaveData = employeeLeaveData
      .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))
      .map(formatLeaveData);

    const approvedLeave = leaveData.filter(leave => leave.status === "approved");
    const pendingLeave = leaveData.filter(leave => leave.status === "pending");
    const upcomingLeave = leaveData.filter(leave => new Date(leave.fromDate) > now);

    const [pendingLeaveDays, upComingLeaveDays, approvedLeaveDays] = await Promise.all([
      sumLeaveDays(pendingLeave),
      sumLeaveDays(upcomingLeave),
      sumLeaveDays(approvedLeave)
    ])

    res.send({
      leaveData,
      approvedLeave: approvedLeaveDays,
      pendingLeave: pendingLeaveDays,
      upcomingLeave: upComingLeaveDays,
      leaveInHours: approvedLeave * 9
    });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching leave data:", error);
    res.status(500).send({
      error: error.message
    });
  }
});

leaveApp.get("/", verifyAdminHR, async (req, res) => {
  try {
    let requests = await LeaveApplication.find().populate({
      path: "employee",
      select: "FirstName LastName profile"
    });
    if (!requests) {
      res.status(203).send({
        message: "No leave requests in DB"
      })
    } else {
      requests = requests.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
      requests = requests.map((leave) => {
        return {
          ...leave.toObject(),
          prescription: leave.prescription
            ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
            : null
        }
      })
      res.send(requests);
    }
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    res.status(500).send({ message: "Internal Server Error", details: err.message })
  }
});

// need to update this api
leaveApp.put("/reject-leave", async (req, res) => {
  try {
    const today = new Date();
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

    let leaves = await LeaveApplication.find({
      fromDate: { $lte: endOfDay },
      leaveType: { $nin: ["Unpaid Leave (LWP)"] },
      status: "pending"
    }).populate("employee", "FirstName LastName Email").exec();

    if (!leaves.length) {
      return res.status(200).send({ message: "No pending leave applications found for today." });
    }

    const actualLeave = leaves.filter((leave) => new Date(leave.fromDate).toLocaleDateString() !== new Date(leave.createdAt).toLocaleDateString())

    await Promise.all(actualLeave.map(async (leave) => {
      let approvers = {};
      Object.entries(leave.approvers).map(([key, value]) => {
        approvers[key] = "rejected"
      })
      const updatedLeave = {
        leaveType: leave.leaveType,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        periodOfLeave: leave.periodOfLeave || "full day",
        reasonForLeave: leave.reasonForLeave || "Not specified",
        prescription: leave.prescription,
        employee: leave.employee._id,
        coverBy: leave.coverBy,
        status: "rejected",
        approvers
      };

      await LeaveApplication.findByIdAndUpdate(leave._id, updatedLeave, { new: true });

      const employee = leave.employee;
      const actualFromDate = changeClientTimezoneDate(leave.fromDate);
      const actualToDate = changeClientTimezoneDate(leave.toDate)
      const htmlContent = `
        <p>Dear ${employee?.FirstName || "Employee"},</p>
        <p>This is to inform you that your recent leave application(${leave.leaveType}/ (<b>${formatDate(actualFromDate)} - ${formatDate(actualToDate)}</b>)) has not been responsed by the higher officials.</p>
        <p style="color: red; font-weight: bold;">Kindly note that if you choose to proceed with the leave, it will be considered as unpaid and may result in a corresponding deduction from your salary.</p>
        <p>Thank you for your understanding.</p>
      `;

      await sendMail({
        From: `<${process.env.FROM_MAIL}> (Nexshr)`,
        To: employee?.Email,
        Subject: `Leave Application Rejected ${leave.leaveType}/ (${formatDate(actualFromDate)} - ${formatDate(actualToDate)})`,
        HtmlBody: htmlContent,
      });
    }));

    return res.status(200).send({ message: "Leave rejection processed successfully." });

  } catch (error) {
    // await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error processing leave rejections:", error);
    return res.status(500).send({ error: error.message });
  }
});

// Optimized and cleaned leave application route
leaveApp.post("/:empId", verifyAdminHREmployeeManagerNetwork, upload.single("prescription"), async (req, res) => {
  try {
    const { empId } = req.params;

    // check leave form validation
    const { error } = LeaveApplicationValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    const {
      leaveType, fromDate, toDate, periodOfLeave,
      reasonForLeave, coverBy, applyFor, role
    } = req.body;


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(fromDate);

    // fromDateObj.setHours(0, 0, 0, 0);
    const toDateObj = new Date(toDate);
    const prescription = req.file?.filename || null;
    const coverByValue = [undefined, "undefined"].includes(coverBy) ? null : coverBy;
    const personId = [undefined, "undefined"].includes(applyFor) ? empId : applyFor;

    // Determine account level
    let accountLevel = 3;
    if (role) {
      const roleData = await RoleAndPermission.findById(role, "RoleName");
      const roleName = roleData?.RoleName?.toLowerCase();
      const roleLevels = { admin: 1, hr: 2, manager: 4, "network admin": 5 };
      accountLevel = roleLevels[roleName] || 3;
    }

    // ✅ Check team leave count
    const team = await Team.findOne({ employees: empId }, "employees");
    if (team?.employees?.length) {
      const overlappingleaveApps = await LeaveApplication.find({
        employee: { $in: team.employees },
        status: "approved",
        fromDate: { $lte: toDate },
        toDate: { $gte: fromDate },
      });

      if (overlappingleaveApps.length >= 2) {
        return res.status(400).json({ error: "Already two members are approved for leave in this time period." });
      }
    }

    // 1. Reject if employee was working on selected dates
    if (applyFor && applyFor !== "undefined") {
      const emp = await Employee.findById(personId, "clockIns").populate({
        path: "clockIns",
        match: { date: { $gte: fromDateObj, $lte: toDateObj } },
      });
      if (emp?.clockIns?.length) {
        return res.status(400).json({ error: "The employee was working during the selected leave period." });
      }
    }

    // 2. Duplicate leave check
    const existingRequest = await LeaveApplication.findOne({
      employee: personId,
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate }
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists for the given date range." });
    }

    // 3. Same day/tomorrow restriction for Sick/Medical Leave
    const formattedFrom = changeClientTimezoneDate(fromDateObj).toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (!applyFor || applyFor === "undefined") {
      if (["Sick Leave"].includes(leaveType) &&
        ![today.toDateString(), tomorrow.toDateString()].includes(formattedFrom)) {
        return res.status(400).json({ error: "Sick leave is only applicable for today or tomorrow." });
      }

      if (["Annual Leave", "Casual Leave"].includes(leaveType) &&
        [3, 5].includes(accountLevel) && [today.toDateString(), tomorrow.toDateString()].includes(formattedFrom)) {
        return res.status(400).json({ error: `${leaveType} is not allowed for same day and next dates for your role.` });
      }
    }

    const higherOfficals = ["lead", "head", "manager", "admin", "hr"];
    // 4. Fetch employee
    const emp = await Employee.findById(personId, "FirstName LastName Email monthlyPermissions permissionHour typesOfLeaveRemainingDays leaveApplication company team workingTimePattern")
      .populate([
        { path: "leaveApplication", match: { leaveType: "Permission Leave", fromDate: { $gte: new Date(fromDateObj.getFullYear(), fromDateObj.getMonth(), 1), $lte: new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0) } } },
        { path: "company", select: "logo CompanyName" },
        { path: "team", populate: higherOfficals.map(role => ({ path: role, select: "FirstName LastName Email fcmToken" })) }
      ]);
    if (!emp) return res.status(400).json({ error: `No employee found for ID ${empId}` });

    // check leave request is weekend or holiday
    function checkDateIsHoliday(dateList, target) {
      return dateList.some((holiday) => new Date(holiday.date).toLocaleDateString() === new Date(target).toLocaleDateString());
    }
    const holiday = await Holiday.findOne({ currentYear: new Date().getFullYear(), company: emp.company._id });
    if (holiday && holiday?.holidays?.length) {
      const isFromDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
      const isToDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
      if (isFromDateHoliday) {
        return res.status(400).send("holiday are not allowed for fromDate")
      } if (isToDateHoliday) {
        return res.status(400).send("holiday are not allowed for toDate")
      }
    }
    async function checkDateIsWeekend(date) {
      const timePattern = await TimePattern.findById(emp.workingTimePattern, "WeeklyDays").lean().exec();
      const zonedDate = toZonedTime(date, process.env.TIMEZONE);
      const isWeekend = !timePattern?.WeeklyDays.includes(format(zonedDate, "EEEE"));
      return isWeekend;
    }
    const [fromDateIsWeekend, toDateIsWeekend] = await Promise.all([checkDateIsWeekend(fromDateObj.toISOString()), checkDateIsWeekend(toDateObj)])
    if (fromDateIsWeekend) {
      return res.status(400).send({ error: "Weekend is not allowed in fromDate" })
    } if (toDateIsWeekend) {
      return res.status(400).send({ error: "Weekend is not allowed in toDate" })
    }

    // 5. Permission Leave checks
    if (leaveType.toLowerCase().includes("permission")) {
      const durationInMinutes = (new Date(toDate) - new Date(fromDate)) / 60000;
      // check permission duration
      if (durationInMinutes > (emp.permissionHour || 120)) {
        return res.status(400).json({ error: `Permission is only allowed for less than ${emp.permissionHour || "2"} hours.` });
      }
      // check permission counts in current month
      if ((emp.leaveApplication?.length || 0) >= (emp.monthlyPermissions || 2)) {
        return res.status(400).json({ error: `You have already used ${emp.monthlyPermissions} permissions this month.` });
      }
    }

    // 6. Leave balance check
    const approvedLeaves = await LeaveApplication.find({
      leaveType: new RegExp(`^${leaveType}`, "i"),
      status: "approved",
      employee: personId,
    });
    const takenLeaveCount = await sumLeaveDays(approvedLeaves);
    if (!leaveType.toLowerCase().includes("permission") && (emp.typesOfLeaveRemainingDays?.[leaveType] || 0) < takenLeaveCount) {
      return res.status(400).json({ error: `${leaveType} limit has been reached.` });
    }

    // 7. Task conflict
    const deadlineTasks = await Task.find({ assignedTo: personId, to: { $gte: fromDateObj, $lte: toDate } });

    // 8. Setup approvers
    const approvers = {};
    ["lead", "head", "manager", "hr"].forEach(role => {
      if (emp.team?.[role] && emp.team?.[role].length) approvers[role] = (applyFor && applyFor !== "undefined" || leaveType === "Permission Leave") ? "approved" : "pending";
    });

    const leaveRequest = {
      leaveType, fromDate, toDate, periodOfLeave, reasonForLeave,
      prescription, approvers,
      status: (applyFor && applyFor !== "undefined" || leaveType === "Permission Leave") ? "approved" : "pending",
      coverBy: coverByValue,
      employee: personId,
      appliedBy: empId,
    };

    // Deduct days if approved and not permission
    if (applyFor && !leaveType.toLowerCase().includes("permission")) {
      const days = Math.max(await getDayDifference(leaveRequest), 1);
      emp.typesOfLeaveRemainingDays[leaveType] -= days;
      await emp.save();
    }

    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    emp.leaveApplication.push(newLeaveApp._id);
    await emp.save();

    // 9. Notify approvers (self-apply only)
    const notify = [];
    if (!applyFor || applyFor === "undefined") {
      higherOfficals.forEach(role => {
        const members = emp.team?.[role];
        const recipients = Array.isArray(members) ? members : [members];
        recipients.forEach(async member => {
          if (!member?.Email) return;
          const notification = {
            company: emp.company._id,
            title: "Leave apply Notification",
            message: `${emp.FirstName} ${emp.LastName} has applied for leave from ${formatDate(changeClientTimezoneDate(fromDate))} to ${formatDate(changeClientTimezoneDate(toDate))}.`,
          };
          sendMail({
            From: `<${emp.Email}> (Nexshr)`,
            To: member.Email,
            Subject: "Leave Application Notification",
            HtmlBody: generateLeaveEmail(emp, fromDate, toDate, reasonForLeave, leaveType, deadlineTasks),
          });
          const fullEmp = await Employee.findById(member._id, "notifications");
          fullEmp.notifications.push(notification);
          await fullEmp.save();
          // set dyanmic path depends on role
          const path = `${process.env.FRONTEND_BASE_URL}/${["lead", "head"].includes(role) ? "emp" : role === "manager" ? "manager" : role === "admin" ? "admin" : "hr"}/leave/leave-request`
          await sendPushNotification({
            token: member.fcmToken,
            title: notification.title,
            body: notification.message,
            path
          });
          notify.push(member.Email);
        });
      });
    }

    return res.status(201).json({ message: "Leave request submitted successfully.", newLeaveApp, notifiedMembers: notify });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("error in apply leave", err);
    return res.status(500).json({ error: err.message });
  }
});

leaveApp.put('/:id', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { approvers, employee, leaveType, fromDate, toDate, status, ...restBody } = req.body;
    let updatedStatus = status;
    const fromDateValue = new Date(fromDate);
    const toDateValue = new Date(toDate);
    const leaveHour = fromDateValue.getHours() || 0;
    const startOfDay = new Date();
    startOfDay.setHours(leaveHour - 2, 0, 0, 0);

    const emp = await Employee.findById(employee, "FirstName LastName Email typesOfLeaveRemainingDays team company workingTimePattern")
      .populate([
        {
          path: "team",
          populate: ["lead", "head", "manager", "admin", "hr"].map(role => ({
            path: role,
            select: "FirstName LastName Email fcmToken notifications"
          }))
        },
        { path: "workingTimePattern", select: "WeeklyDays" },
        { path: "company", select: "CompanyName logo" }
      ]).lean();

    if (!emp) return res.status(404).send({ error: 'Employee not found.' });
    if (!emp.team) return res.status(404).send({ error: `${emp.FirstName} is not assigned to a team.` });
    const leaveApplicationYear = new Date(req.body.fromDate).getFullYear();
    const holiday = await Holiday.findOne({ currentYear: leaveApplicationYear });
    const checkDateIsHoliday = (date, holidays = []) => holidays.some(h => new Date(h.date).toDateString() === new Date(date).toDateString());
    const checkDateIsWeekend = (date, weeklyDays = []) => !weeklyDays.includes(format(date, "EEEE"));

    const actualfromDate = changeClientTimezoneDate(fromDate);
    const actualtoDate = changeClientTimezoneDate(toDate);
    if (checkDateIsHoliday(actualfromDate, holiday.holidays)) return res.status(400).send("Holiday is not allowed for fromDate");
    if (checkDateIsHoliday(actualtoDate, holiday.holidays)) return res.status(400).send("Holiday is not allowed for toDate");
    if (checkDateIsWeekend(actualfromDate, emp.workingTimePattern.WeeklyDays)) return res.status(400).send({ error: "Weekend is not allowed in fromDate" });
    if (checkDateIsWeekend(actualtoDate, emp.workingTimePattern.WeeklyDays)) return res.status(400).send({ error: "Weekend is not allowed in toDate" });

    let updatedApprovers = approvers;
    if (["approved", "rejected"].includes(status)) {
      updatedApprovers = Object.fromEntries(Object.keys(approvers).map(key => [key, status]));
      if (status === "approved") {
        const team = await Team.findOne({ employees: employee }, "employees");
        const overlappingLeaves = await LeaveApplication.find({
          employee: { $in: team?.employees || [] },
          status: "approved",
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate },
        });
        if (overlappingLeaves.length >= 2) return res.status(400).json({ error: "Already two members are approved for leave in this time period." });
      }
    }

    const approverStatuses = Object.values(updatedApprovers);
    const allApproved = approverStatuses.every(s => s === "approved");
    const anyRejected = approverStatuses.includes("rejected");
    const allPending = approverStatuses.every(s => s === "pending");

    const actionBy = req.query.actionBy;
    const emailType = allApproved ? "approved" : anyRejected ? "rejected" : "pending";
    updatedStatus = allApproved ? "approved" : anyRejected ? "rejected" : "pending";
    const mailList = [];

    if (allApproved && !["unpaid leave (lwp)", "permission"].includes(leaveType.toLowerCase())) {
      const leaveDaysTaken = Math.max(await getDayDifference(req.body), 1);

      const currentValue = emp.typesOfLeaveRemainingDays?.[leaveType];

      // Convert to number (handles string or number)
      const currentNumber = typeof currentValue === "string"
        ? parseFloat(currentValue)
        : currentValue;

      if (typeof currentNumber === "number" && !isNaN(currentNumber)) {
        if (currentNumber < leaveDaysTaken) {
          return res.status(400).send({ error: "Insufficient leave balance." });
        }

        const newValue = currentNumber - leaveDaysTaken;

        await Employee.findByIdAndUpdate(emp._id, {
          $set: { [`typesOfLeaveRemainingDays.${leaveType}`]: newValue }
        });
      } else {
        console.error(`❌ Invalid leave balance for "${leaveType}":`, currentValue);
        return res.status(400).send({ error: `Invalid leave balance for ${leaveType}.` });
      }
    }

    if (!allPending) {
      const Subject = "Leave Application Response Notification";
      const message = `${emp.FirstName}'s leave application has been ${emailType} by ${actionBy}`;

      const members = [
        { type: "emp", Email: emp.Email, name: `${emp.FirstName} ${emp.LastName}`, _id: emp._id, fcmToken: null },
        ...["lead", "head", "manager", "admin", "hr"].flatMap(role => {
          const roleMembers = Array.isArray(emp.team[role]) ? emp.team[role] : [emp.team[role]].filter(Boolean);
          return roleMembers.map(m => ({
            type: role,
            Email: m.Email,
            name: `${m.FirstName} ${m.LastName}`.trim(),
            fcmToken: m.fcmToken,
            _id: m._id
          }));
        })
      ];

      const notified = new Set();
      for (const member of members) {
        if (!actionBy.toLowerCase().includes(member.type)) {
          if (!notified.has(member.Email)) {
            notified.add(member.Email);
            mailList.push(member.Email);

            await sendMail({
              From: `< ${process.env.FROM_MAIL} > (Nexshr)`,
              To: member.Email,
              Subject,
              HtmlBody: mailContent(emailType, fromDateValue, toDateValue, emp, leaveType, actionBy, member)
            });

            await Employee.findByIdAndUpdate(member._id, {
              $push: {
                notifications: {
                  company: emp.company._id,
                  title: Subject,
                  message
                }
              }
            });

            if (member.fcmToken) {
              let path;
              if (member.type === "emp") {
                path = `${process.env.FRONTEND_BASE_URL}/emp/job-desk/leave`
              } else if (["lead", "head"].includes(member.type)) {
                path = `${process.env.FRONTEND_BASE_URL}/emp/leave/leave-request`
              } else {
                path = `${process.env.FRONTEND_BASE_URL}/${member.type}/leave/leave-request`
              }
              await sendPushNotification({
                token: member.fcmToken,
                title: Subject,
                body: message,
                path
              });
            }
          }
        }
      }
    }

    const updatedLeaveApp = { ...req.body, approvers: updatedApprovers, status: updatedStatus };
    const updatedRequest = await LeaveApplication.findOneAndUpdate(
      { _id: req.params.id, fromDate: { $gt: startOfDay } },
      updatedLeaveApp,
      { new: true }
    );

    res.send({
      message: 'You have responded to the leave application.',
      data: updatedRequest,
      notifiedMembers: mailList
    });
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.error("error in update leave", err);
    res.status(500).send({ error: err.message });
  }
});

leaveApp.delete("/:id/:leaveId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      res.status(404).send({ message: "Employee not found in this ID" })
    }
    else {
      const leave = await LeaveApplication.findById(req.params.leaveId);
      // check leave is unpaid leave
      if (leave.leaveType.toLowerCase().includes("unpaid")) {
        return res.status(400).send({ error: "You can't delete unpaid leave request" })
      }
      if (leave.status === "pending") {
        const dltLeave = await LeaveApplication.findByIdAndRemove(req.params.leaveId)
        if (!dltLeave) {
          return res.status(409).send({ message: "Error in deleting leave or leave not found" })
        } else {
          const leaveApplication = await emp.leaveApplication.filter((leaveId) => {
            return leaveId !== req.params.leaveId
          })
          emp.leaveApplication = leaveApplication;
          await emp.save();
          res.send({ message: "Leave Request has been deleted" })
        }
      } else {
        return res.status(400).send({ error: "You can't delete reponsed Leave." })
      }
    }
  } catch (err) {
    await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
    console.log(err);
    res.status(500).send({ message: "Error in delete Leave request", details: err.message })
  }
})

module.exports = { leaveApp, getDayDifference };
