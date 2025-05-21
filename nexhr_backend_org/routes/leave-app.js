const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyEmployee, verifyAdmin, verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdminHREmployee, verifyTeamHigherAuthority, verifyAdminHrNetworkAdmin } = require('../auth/authMiddleware');
const { Team } = require('../models/TeamModel');
const { upload } = require('./imgUpload');
const sendMail = require("./mailSender");
const { getDayDifference, mailContent, formatLeaveData, formatDate } = require('../Reuseable_functions/reusableFunction');
const { Task } = require('../models/TaskModel');
const { sendPushNotification } = require('../auth/PushNotification');

// Helper function to generate leave request email content
function generateLeaveEmail(empData, fromDateValue, toDateValue, reasonForLeave, leaveType, accountLevel, deadLineTask = []) {
  const fromDate = new Date(fromDateValue);
  const toDate = new Date(toDateValue);

  const formattedFromDate = `${fromDate.toLocaleString("default", { month: "long" })} ${fromDate.getDate()}, ${fromDate.getFullYear()}`;
  const formattedToDate = `${toDate.toLocaleString("default", { month: "long" })} ${toDate.getDate()}, ${toDate.getFullYear()}`;

  const deadlineTasksHtml = deadLineTask.length
    ? `
      <h3 style="text-align:center;margin: 10px 0;">${empData.FirstName} ${empData.LastName} has ${deadLineTask.length} deadline task(s)</h3>
      ${deadLineTask
      .map(
        (task) =>
          `<p><b>${task.title}</b> (${task.status}): (${task.from} - ${task.to})</p>`
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

leaveApp.get("/make-know", async (req, res) => {
  try {
    const leaveApps = await LeaveApplication.find({ status: "pending" })
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

      const Subject = "Leave Application Reminder";
      const message = `${emp.FirstName} has applied for leave from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} due to ${leave.reasonForLeave.replace(/<\/?[^>]+(>|$)/g, '')}. Please respond to this request.`;

      const members = [];

      for (const role of ["lead", "head", "manager", "hr"]) {
        for (const member of teamData[role]) {
          if (member) {
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
                <h1 style="margin: 0;">${leave.employee.FirstName} ${leave.employee.LastName} has applied for leave From ${leave.fromDate} To ${leave.toDate}</h1>
              </div>
              <div style="margin: 20px 0;">
                <p>Hi all,</p>
                <p>I have applied for leave from ${leave.fromDate} to ${leave.toDate} due to ${leave.reasonForLeave}. Please respond to this request.</p>
                <p>Thank you!</p>
              </div>
            </div>
          </body>
        </html>
      `;

            // Email
            await sendMail({
              From: emp.Email,
              To: member.Email,
              Subject,
              HtmlBody: htmlContent,
            });

            // Notification
            const notification = {
              company: emp.company._id,
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
                company: emp.company
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
    console.error("Error in /make-know:", error);
    res.status(500).json({ error: "An error occurred while processing leave applications." });
  }
});


// need to update this api
leaveApp.put("/reject-leave", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

    const leaves = await LeaveApplication.find({
      fromDate: { $gte: startOfDay, $lte: endOfDay },
      status: "pending"
    }).populate("employee", "FirstName LastName Email").exec();

    if (!leaves.length) {
      return res.status(200).send({ message: "No pending leave applications found for today." });
    }

    await Promise.all(leaves.map(async (leave) => {
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

      const htmlContent = `
        <p>Dear ${employee?.FirstName || "Employee"},</p>
        <p>This is to inform you that your recent leave application(${leave.leaveType}/ (<b>${formatDate(leave.fromDate)} - ${formatDate(leave.toDate)}</b>)) has not been responsed by the higher officials.</p>
        <p style="color: red; font-weight: bold;">Kindly note that if you choose to proceed with the leave, it will be considered as unpaid and may result in a corresponding deduction from your salary.</p>
        <p>Thank you for your understanding.</p>
      `;

      await sendMail({
        From: process.env.FROM_MAIL,
        To: employee?.Email,
        Subject: `Leave Application Rejected ${leave.leaveType}/ (${formatDate(leave.fromDate)} - ${formatDate(leave.toDate)})`,
        HtmlBody: htmlContent,
      });
    }));

    return res.status(200).send({ message: "Leave rejection processed successfully." });

  } catch (error) {
    console.error("Error processing leave rejections:", error.message);
    return res.status(500).send({ error: "An error occurred while processing leave rejections." });
  }
});

// get employee of all leave application From annualLeaveYearStart date
leaveApp.get("/emp/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { empId } = req.params;
    const { daterangeValue } = req.query;

    // Fetch employee data with necessary fields
    let emp = await Employee.findById(empId,
      "annualLeaveYearStart position FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays team profile"
    ).populate([{ path: "position", select: "PositionName" }, { path: "team", populate: { path: "employees", select: "FirstName LastName Email phone" } }]).lean();

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
    // const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
    // const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
    const filterLeaves = { fromDate: { $lte: today }, toDate: { $gte: today }, status: "approved" };

    // **Parallel Data Fetching**
    let [leaveApplications, peopleOnLeave, team] = await Promise.all([
      LeaveApplication.find({
        employee: empId,
        fromDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
        .populate("employee", "FirstName LastName")
        .lean(),
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
    // const colleagues = emp.team.employees.filter((emp) => emp._id !== req.params.empId)
    res.json({
      employee: emp,
      leaveApplications: leaveApplications.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)).map(changeActualImgData),
      peopleOnLeave,
      peopleLeaveOnMonth: peopleLeaveOnMonth.map(changeActualImgData)
    });

  } catch (err) {
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
    const leaveReqs = await Employee.find({ _id: { $in: empIds } }, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        populate: { path: "employee", select: "_id FirstName LastName profile" }
      });

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
    empLeaveReqs = empLeaveReqs.map(formatLeaveData)
    res.send(empLeaveReqs);
  } catch (err) {
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
    const team = await Team.findOne({ [who]: req.params.id }).exec();

    if (!team) {
      return res.status(404).json({ error: "You are not lead in any team" });
    }

    const { employees } = team;

    // Fetch team members' basic info
    const colleagues = await Employee.find(
      { _id: { $in: employees } },
      "FirstName LastName Email phone profile"
    ).lean();

    // Fetch leave applications within the date range
    let teamLeaves = await LeaveApplication.find({
      employee: { $in: employees },
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
    const baseURL = process.env.REACT_APP_API_URL;
    teamLeaves = teamLeaves.map((leave) => ({
      ...leave,
      prescription: leave.prescription ? `${baseURL}/uploads/${leave.prescription}` : null
    }));

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
    const takenLeave = approvedLeave.filter(l => new Date(l.fromDate).getTime() < nowTime);

    res.json({
      leaveData: teamLeaves,
      pendingLeave,
      upComingLeave,
      approvedLeave,
      peoplesOnLeave,
      takenLeave,
      colleagues
    });
  } catch (error) {
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
      fromDate: { $gte: startOfDay, $lte: endOfDay },
      leaveType: { $nin: ["Permission", "Permission Leave"] },
      status: "approved"
    }, "fromDate toDate status leaveType")
      .populate({
        path: "employee",
        select: "FirstName LastName profile",
        populate: {
          path: "team",
          select: "teamName"
        }
      })
      .lean()
      .exec();

    return res.status(200).send(leaveData);
  } catch (error) {
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
    const employeesLeaveData = await Employee.find(filterObj, "_id FirstName LastName profile")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $gte: startOfMonth, $lte: endOfMonth },
          toDate: { $gte: startOfMonth, $lte: endOfMonth }
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
    const leaveInHours = approvedLeave.reduce(
      (total, leave) => total + getDayDifference(leave) * 9, 0
    );

    const pendingLeave = leaveData.filter(leave => leave.status === "pending");
    const upcomingLeave = leaveData.filter(leave => new Date(leave.fromDate) > now);
    const peopleOnLeave = approvedLeave.filter(leave =>
      new Date(leave.fromDate).toDateString() === now.toDateString()
    );

    res.send({
      leaveData,
      approvedLeave,
      leaveInHours,
      peopleOnLeave,
      pendingLeave,
      upcomingLeave
    });
  } catch (error) {
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
    const employeeLeaveData = await Employee.findById(req.params.empId, "_id FirstName LastName profile")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $gte: startOfMonth, $lte: endOfMonth },
          toDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        populate: [
          { path: "employee", select: "FirstName LastName Email profile" },
          { path: "coverBy", select: "FirstName LastName Email profile" }
        ]
      });

    if (!employeeLeaveData || !employeeLeaveData.leaveApplication.length) {
      return res.send({
        leaveData: [],
        approvedLeave: [],
        peopleOnLeave: [],
        pendingLeave: [],
        upcomingLeave: [],
        leaveInHours: 0
      });
    }

    const leaveData = employeeLeaveData.leaveApplication
      .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))
      .map(formatLeaveData);

    const approvedLeave = leaveData.filter(leave => leave.status === "approved");
    const leaveInHours = approvedLeave.reduce(
      (total, leave) => total + getDayDifference(leave) * 9, 0
    );

    const pendingLeave = leaveData.filter(leave => leave.status === "pending");
    const upcomingLeave = leaveData.filter(leave => new Date(leave.fromDate) > now);
    const peopleOnLeave = approvedLeave.filter(leave =>
      new Date(leave.fromDate).toDateString() === now.toDateString()
    );

    res.send({
      leaveData,
      approvedLeave,
      peopleOnLeave,
      pendingLeave,
      upcomingLeave,
      leaveInHours
    });
  } catch (error) {
    console.error("Error fetching leave data:", error);
    res.status(500).send({
      message: "Error retrieving leave requests.",
      details: error.message
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
    res.status(500).send({ message: "Internal Server Error", details: err.message })
  }
});

// Optimized and cleaned leave application route
leaveApp.post("/:empId", verifyAdminHREmployeeManagerNetwork, upload.single("prescription"), async (req, res) => {
  try {
    const { empId } = req.params;
    const {
      leaveType, fromDate, toDate, periodOfLeave, reasonForLeave,
      coverBy, applyFor, role
    } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(fromDate);
    fromDateObj.setHours(0, 0, 0, 0);
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
      status: "approved",
      fromDate: { $gte: fromDate, $lte: toDate },
    });
    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists for the given date range." });
    }

    // 3. Same day/tomorrow restriction for Sick/Medical Leave
    const formattedFrom = fromDateObj.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (!applyFor || applyFor === "undefined") {
      if (["Sick Leave", "Medical Leave"].includes(leaveType) &&
        ![today.toDateString(), tomorrow.toDateString()].includes(formattedFrom)) {
        return res.status(400).json({ error: "Sick leave is only applicable for today or tomorrow." });
      }

      if (["Annual Leave", "Casual Leave"].includes(leaveType) &&
        [3, 5].includes(accountLevel) && fromDateObj <= today) {
        return res.status(400).json({ error: `${leaveType} is not allowed for same day or past dates for your role.` });
      }
    }

    // 4. Fetch employee
    const emp = await Employee.findById(personId, "FirstName LastName Email monthlyPermissions permissionHour typesOfLeaveRemainingDays leaveApplication company team")
      .populate([
        { path: "leaveApplication", match: { leaveType: "Permission Leave", fromDate: { $gte: new Date(fromDateObj.getFullYear(), fromDateObj.getMonth(), 1), $lte: new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0) } } },
        { path: "company", select: "logo CompanyName" },
        { path: "team", populate: ["lead", "head", "manager", "admin", "hr"].map(role => ({ path: role, select: "FirstName LastName Email fcmToken" })) }
      ]);
    if (!emp) return res.status(400).json({ error: `No employee found for ID ${empId}` });

    // 5. Permission Leave checks
    if (leaveType.toLowerCase().includes("permission")) {
      const durationInMinutes = (new Date(toDate) - new Date(fromDate)) / 60000;
      if (durationInMinutes > (emp.permissionHour || 120)) {
        return res.status(400).json({ error: `Permission is only allowed for less than ${emp.permissionHour || "2"} hours.` });
      }
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
    const takenLeaveCount = approvedLeaves.reduce((acc, leave) => acc + getDayDifference(leave), 0);
    if (!leaveType.toLowerCase().includes("permission") && (emp.typesOfLeaveRemainingDays?.[leaveType] || 0) < takenLeaveCount) {
      return res.status(400).json({ error: `${leaveType} limit has been reached.` });
    }

    // 7. Task conflict
    const deadlineTasks = await Task.find({ assignedTo: personId, to: { $gte: fromDate, $lte: toDate } });

    // 8. Setup approvers
    const approvers = {};
    ["lead", "head", "manager", "hr"].forEach(role => {
      if (emp.team?.[role]) approvers[role] = applyFor && applyFor !== "undefined" ? "approved" : "pending";
    });

    const leaveRequest = {
      leaveType, fromDate, toDate, periodOfLeave, reasonForLeave,
      prescription, approvers,
      status: applyFor && applyFor !== "undefined" ? "approved" : "pending",
      coverBy: coverByValue,
      employee: personId,
      appliedBy: empId,
    };

    // Deduct days if approved and not permission
    if (applyFor && !leaveType.toLowerCase().includes("permission")) {
      const days = Math.max(getDayDifference(leaveRequest), 1);
      emp.typesOfLeaveRemainingDays[leaveType] -= days;
      await emp.save();
    }

    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    emp.leaveApplication.push(newLeaveApp._id);
    await emp.save();

    // 9. Notify approvers (self-apply only)
    const notify = [];
    if (!applyFor || applyFor === "undefined") {
      ["lead", "head", "manager", "hr", "admin"].forEach(role => {
        const members = emp.team?.[role];
        const recipients = Array.isArray(members) ? members : [members];
        recipients.forEach(async member => {
          if (!member?.Email) return;
          const notification = {
            company: emp.company._id,
            title: "Leave apply Notification",
            message: `${emp.FirstName} ${emp.LastName} has applied for leave from ${formatDate(fromDate)} to ${formatDate(toDate)}.`,
          };
          sendMail({
            From: emp.Email,
            To: member.Email,
            Subject: "Leave Application Notification",
            HtmlBody: generateLeaveEmail(emp, fromDate, toDate, reasonForLeave, leaveType, deadlineTasks),
          });
          const fullEmp = await Employee.findById(member._id, "notifications");
          fullEmp.notifications.push(notification);
          await fullEmp.save();
          await sendPushNotification({ token: member.fcmToken, title: notification.title, body: notification.message, company: emp.company });
          notify.push(member.Email);
        });
      });
    }

    return res.status(201).json({ message: "Leave request submitted successfully.", newLeaveApp, notifiedMembers: notify });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

leaveApp.put('/:id', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { approvers, employee, leaveType, fromDate, toDate, ...restBody } = req.body;

    const fromDateValue = new Date(fromDate);
    const toDateValue = new Date(toDate);
    const today = new Date();
    const leaveHour = fromDateValue.getHours() || 0;
    const startOfDay = new Date(today.setHours(leaveHour - 2, 0, 0, 0));

    const allApproved = Object.values(approvers).every(status => status === "approved");
    const anyRejected = Object.values(approvers).some(status => status === "rejected");
    const allPending = Object.values(approvers).every(status => status === "pending");

    const emp = await Employee.findById(employee, "FirstName LastName Email typesOfLeaveRemainingDays team company")
      .populate([
        {
          path: "team",
          populate: [
            { path: "lead", select: "FirstName LastName Email fcmToken notifications" },
            { path: "head", select: "FirstName LastName Email fcmToken notifications" },
            { path: "manager", select: "FirstName LastName Email fcmToken notifications" },
            { path: "admin", select: "FirstName LastName Email fcmToken notifications" },
            { path: "hr", select: "FirstName LastName Email fcmToken notifications" }
          ]
        },
        { path: "company", select: "CompanyName logo" }
      ])
      .lean();

    if (!emp) return res.status(404).send({ error: 'Employee not found.' });
    if (!emp.team) return res.status(404).send({ error: `${emp.FirstName} is not assigned to a team.` });

    const actionBy = req.query.actionBy;
    const emailType = allApproved ? "approved" : anyRejected ? "rejected" : "pending";
    let mailList = [];

    // Deduct leave if approved and check unpaid leave
    if (!allPending && allApproved && !leaveType.toLowerCase().includes("unpaid")) {
      const leaveDaysTaken = Math.max(getDayDifference({ fromDate, toDate }), 1);
      const leaveBalance = emp.typesOfLeaveRemainingDays?.[leaveType] ?? 0;

      if (leaveBalance < leaveDaysTaken) {
        return res.status(400).send({ error: 'Insufficient leave balance for the requested leave type.' });
      }

      await Employee.findByIdAndUpdate(emp._id, {
        $inc: { [`typesOfLeaveRemainingDays.${leaveType}`]: -leaveDaysTaken }
      });
    }

    // Notify members if status changed
    if (!allPending && !leaveType.toLowerCase().includes("unpaid")) {
      const Subject = "Leave Application Response Notification";
      const message = anyRejected
        ? `${emp.FirstName}'s leave application has been rejected by ${actionBy}`
        : `${emp.FirstName}'s leave application has been approved by ${actionBy}`;

      const getMembers = (data, type) =>
        Array.isArray(data)
          ? data.map(item => ({
            type,
            Email: item?.Email,
            name: `${item?.FirstName ?? ""} ${item?.LastName ?? ""}`.trim(),
            fcmToken: item?.fcmToken,
            _id: item?._id
          }))
          : data?.Email
            ? [{
              type,
              Email: data.Email,
              name: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
              fcmToken: data?.fcmToken,
              _id: data?._id
            }]
            : [];

      const members = [
        emp.Email && { type: "emp", Email: emp.Email, name: `${emp.FirstName} ${emp.LastName}` },
        ...getMembers(emp.team?.lead, "lead"),
        ...getMembers(emp.team?.head, "head"),
        ...getMembers(emp.team?.manager, "manager"),
        ...getMembers(emp.team?.hr, "hr"),
        ...getMembers(emp.team?.admin, "admin")
      ].filter(Boolean);

      const uniqueEmails = new Set();
      const notifiedMembers = [];

      for (const member of members) {
        if (!uniqueEmails.has(member.Email)) {
          uniqueEmails.add(member.Email);
          mailList.push(member.Email);
          notifiedMembers.push(member);

          // Send Email
          await sendMail({
            From: process.env.FROM_MAIL,
            To: member.Email,
            Subject,
            HtmlBody: mailContent(emailType, fromDateValue, toDateValue, emp, leaveType, actionBy, member),
          });

          // Send Push + Add to Notifications
          const fullEmp = await Employee.findById(member._id);
          if (fullEmp) {
            fullEmp.notifications.push({ company: emp.company._id, title: Subject, message });
            await fullEmp.save();

            await sendPushNotification({
              token: member.fcmToken,
              company: emp.company,
              title: Subject,
              body: message
            });
          }
        }
      }
    }
    //  else if(leaveType.toLowerCase().includes("unpaid")){
    //   // send email and notification
    //   sendMail({
    //     From: process.env.FROM_MAIL,
    //     To: emp.Email,
    //     Subject: `Your Leave app`
    //   })
    // }

    // Update Leave Application
    const updatedLeaveApp = {
      ...req.body,
      approvers,
      status: allApproved ? "approved" : anyRejected ? "rejected" : restBody.status
    };

    const updatedRequest = await LeaveApplication.findOneAndUpdate(
      { _id: req.params.id, fromDate: { $gt: startOfDay } },
      updatedLeaveApp,
      { new: true }
    );

    return res.send({
      message: 'You have responded to the leave application.',
      data: updatedRequest,
      notifiedMembers: mailList
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'An error occurred while processing the request.' });
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
    console.log(err);
    res.status(500).send({ message: "Error in delete Leave request", details: err.message })
  }
})

module.exports = { leaveApp, getDayDifference };
