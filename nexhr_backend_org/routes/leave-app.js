const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyEmployee, verifyAdmin, verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdminHREmployee, verifyTeamHigherAuthority } = require('../auth/authMiddleware');
const { Team } = require('../models/TeamModel');
const { upload } = require('./imgUpload');
const now = new Date();
const sendMail = require("./mailSender");
const { getDayDifference, mailContent, formatLeaveData } = require('../Reuseable_functions/reusableFunction');
const { Task } = require('../models/TaskModel');

// Helper function to generate leave request email content
function generateLeaveEmail(empData, fromDateValue, toDateValue, reasonForLeave, leaveType, deadLineTask = []) {
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
    <title>NexsHR - Leave Application</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
                box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">
      
      <!-- Header -->
      <div style="text-align: center; padding: 20px;">
        <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public"
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
        <p style="font-size: 14px; margin: 10px 0;">Kindly review and respond accordingly.</p>
        <p style="font-size: 14px; margin: 10px 0;">Thank you!</p>
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


// Helper function to generate coverBy email content
function generateCoverByEmail(empData, relievingOffData) {
  return `
  < !DOCTYPE html >
    <html lang="en">
      <head>
        <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NexsHR - Task Assignment</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; padding: 20px;">
                <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Company Logo" style="max-width: 100px;" />
                <h1 style="margin: 0;">Task Assignment Notification</h1>
              </div>

              <div style="margin: 20px 0; font-size: 16px; line-height: 1.5;">
                <p>Hi <strong>${relievingOffData.FirstName}</strong>,</p>
                <p><strong>${empData.FirstName}</strong> has assigned some tasks to you during their leave.</p>
                <p>Please ensure the assigned tasks are completed as required.</p>
                <p>Let us know if you need any assistance.</p>
                <p>Thank you!</p>
              </div>

              <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                <p>&copy; ${new Date().getFullYear()} NexsHR. All rights reserved.</p>
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
        select: "FirstName LastName Email",
        populate: {
          path: "team",
          populate: [
            {
              path: "lead",
              select: "Email",
            },
            {
              path: "head",
              select: "Email",
            },
          ],
        },
      })
      .exec();

    // const {fromDate, toDate, reasonForLeave} = req.body; // Destructure request body

    for (const empData of leaveApps) {
      if (!empData.employee?.team) continue; // Skip if team data is missing

      const { lead, head } = empData.employee.team;
      if (!lead?.Email || !head?.Email) continue; // Skip if lead or head email is missing

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NexsHR</title>
                <style>
                  body {font - family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                  .container {max - width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                  .header {text - align: center; padding: 20px; }
                  .header img {max - width: 100px; }
                  .content {margin: 20px 0; }
                  .footer {text - align: center; font-size: 14px; margin-top: 20px; color: #777; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Logo" />
                    <h1>${empData.employee.FirstName} ${empData.employee.LastName} has applied for leave From ${empData.fromDate} To ${empData.toDate}</h1>
                  </div>
                  <div class="content">
                    <p>Hi all,</p>
                    <p>I have applied for leave From ${empData.fromDate} To ${empData.toDate} due To ${empData.reasonForLeave}. Please respond To this request.</p>
                    <p>Thank you!</p>
                  </div>
                </div>
              </body>
            </html>
            `;

      const mailList = [lead?.Email, head?.Email];

      try {
        sendMail({
          From: process.env.FROM_MAIL,
          To: mailList.join(","),
          Subject: "Leave Application Remember",
          HtmlBody: htmlContent,
        })
        console.log(`Email sent To: ${mailList.join(", ")}`);
      } catch (mailError) {
        console.error(`Failed To send email To ${mailList.join(", ")}:`, mailError);
      }
    }

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing leave applications." });
  }
});

leaveApp.put("/reject-leave", async (req, res) => {
  try {
    const leaves = await LeaveApplication.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $dayOfMonth: "$fromDate" }, 9] }, // Match documents with the 9th day
        },
      },
      {
        $lookup: {
          from: "employees", // ✅ Corrected from "From" to "from"
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $project: {
          leaveType: 1,
          fromDate: 1,
          toDate: 1,
          periodOfLeave: 1,
          reasonForLeave: 1,
          prescription: 1,
          employee: 1,
          coverBy: 1,
          "employeeDetails.FirstName": 1,
          "employeeDetails.LastName": 1,
          "employeeDetails.Email": 1,
        },
      },
    ]);

    if (leaves.length > 0) {
      for (const leave of leaves) {
        const updatedLeave = {
          leaveType: leave.leaveType,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
          periodOfLeave: leave.periodOfLeave || "full day",
          reasonForLeave: leave.reasonForLeave || "fever",
          prescription: leave.prescription,
          employee: leave.employee,
          coverBy: leave.coverBy,
          status: "rejected",
          TeamLead: "rejected",
          Hr: "rejected",
          TeamHead: "rejected",
        };

        await LeaveApplication.findByIdAndUpdate(leave._id, updatedLeave, { new: true });

        const employee = leave.employeeDetails[0]; // ✅ Fix employeeDetails array access

        const htmlContent = `
            <p>Hi ${employee?.FirstName || "Employee"},</p>
            <p>Your leave application has been rejected by higher authority.</p>
            <p style="color: red; font-weight: bold;">If you take leave, It will deduct your salary!</p>
            <p>Thank you!</p>
            `;

        sendMail({
          From: process.env.FROM_MAIL,
          To: employee?.Email || "default@email.com",
          Subject: "Leave Application Rejected",
          HtmlBody: htmlContent,
        });
      }
    }
    res.status(200).send({ message: "Leave rejection processed successfully." });

  } catch (error) {
    console.error("Error fetching leave applications:", error.message);
    res.status(500).send({ error: "An error occurred while fetching data." });
  }
});

// get employee of all leave application From annualLeaveYearStart date
leaveApp.get("/emp/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { empId } = req.params;
    const { daterangeValue } = req.query;

    // Fetch employee data with necessary fields
    let emp = await Employee.findById(empId,
      "annualLeaveYearStart position FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays team"
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
    const filterLeaves = { fromDate: { $lte: today }, toDate: { $gte: today }, status: "approved" };

    // **Parallel Data Fetching**
    const [leaveApplications, peopleOnLeave, team] = await Promise.all([
      LeaveApplication.find({
        employee: empId,
        fromDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
        .populate("employee", "FirstName LastName")
        .lean(),
      LeaveApplication.find(filterLeaves).populate("employee", "FirstName LastName").lean(),
      Team.findOne({ employees: empId }, "employees").lean()
    ]);

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
    const UnpaidLeave = currentMonthOfLeaves.filter((leave) => leave.leaveType.includes("Unpaid")).length;
    emp = {
      ...emp,
      typesOfLeaveCount: {
        ...emp.typesOfLeaveCount,
        ["Unpaid" + " " + "Leave"]: UnpaidLeave
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
        populate: { path: "employee", select: "_id FirstName LastName" }
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
      .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)); // Sort by fromDate
    empLeaveReqs = empLeaveReqs.map(formatLeaveData)
    res.send(empLeaveReqs);
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res.status(500).send({ message: "Internal Server Error", details: err.message });
  }
});

leaveApp.get("/team/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    let startOfMonth;
    let endOfMonth;

    if (req?.query?.daterangeValue) {
      startOfMonth = new Date(req.query.daterangeValue[0]);
      endOfMonth = new Date(req.query.daterangeValue[1]);
    } else {
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }
    const who = req?.query?.who;
    const team = await Team.findOne({ [who]: req.params.id }).exec();
    if (!team) {
      return res.status(404).send({ error: "You are not lead in any team" })
    } else {
      const { employees } = team;
      const colleagues = await Employee.find({ _id: employees }, "FirstName LastName Email phone");
      let teamLeaves = await LeaveApplication.find({
        employee: { $in: employees },
        fromDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        },
        toDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      })
        .populate({
          path: "employee",
          select: "FirstName LastName"
        });
      teamLeaves = teamLeaves.map((leave) => {
        return {
          ...leave.toObject(),
          prescription: leave.prescription
            ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
            : null
        }
      })

      teamLeaves = teamLeaves.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
      const approvedLeave = teamLeaves.filter(data => data.status === "approved");
      const pendingLeave = teamLeaves.filter(data => data.status === "pending");
      const upComingLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() > new Date().getTime())
      const peoplesOnLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() === new Date().getTime())
      const takenLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() < new Date().getTime())
      res.send({ leaveData: teamLeaves, pendingLeave, upComingLeave, approvedLeave, peoplesOnLeave, takenLeave, colleagues });
    }
  } catch (error) {
    console.log(error);

    res.status(500).send({ error: error.message })
  }
});

leaveApp.get("/all/emp", verifyAdminHR, async (req, res) => {
  try {
    const filterByAccount = req.query.isHr ? true : false;

    // Fetch leave data for employees with Account 3
    const employeesLeaveData = await Employee.find(filterByAccount ? { Account: 3 } : {}, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        populate: { path: "employee", select: "FirstName LastName" }
      });
    // Flatten leaveApplication data
    let leaveData = employeesLeaveData.map(data => data.leaveApplication).flat();
    leaveData = leaveData.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
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
          select: "FirstName LastName"
        });
      teamLeaves = teamLeaves.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
      res.send({ leaveData: teamLeaves });
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
});

// get leave application by id
leaveApp.get("/:id", verifyHREmployee, async (req, res) => {
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
leaveApp.get("/date-range/hr", verifyHR, async (req, res) => {
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
    const employeesLeaveData = await Employee.find({ Account: 3 }, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $gte: startOfMonth, $lte: endOfMonth },
          toDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        populate: [
          { path: "employee", select: "FirstName LastName Email" },
          { path: "coverBy", select: "FirstName LastName Email" }
        ]
      });

    let leaveData = employeesLeaveData
      .flatMap(emp => emp.leaveApplication) // Flatten leave data
      .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))
      .map(leave => ({
        ...leave.toObject(),
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

//get all employees of leave application in month
leaveApp.get("/date-range/admin", verifyAdmin, async (req, res) => {
  const now = new Date();
  let startOfMonth, endOfMonth;

  if (req.query?.daterangeValue) {
    startOfMonth = new Date(req.query.daterangeValue[0]);
    endOfMonth = new Date(req.query.daterangeValue[1]);
    endOfMonth.setHours(23, 59, 59, 999); // Ensure the full last day is included
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  try {
    const employeesLeaveData = await Employee.find({}, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $gte: startOfMonth, $lte: endOfMonth },
          toDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        populate: [
          { path: "employee", select: "FirstName LastName Email" },
          { path: "coverBy", select: "FirstName LastName Email" }
        ]
      });

    let leaveData = employeesLeaveData
      .flatMap(emp => emp.leaveApplication) // Flatten leave data
      .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))
      .map(leave => ({
        ...leave.toObject(),
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
    res.status(500).send({ error: "Server error occurred while fetching leave data." });
  }
});

// To get leave range date of data
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
    const employeeLeaveData = await Employee.findById(req.params.empId, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: { $gte: startOfMonth, $lte: endOfMonth },
          toDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        populate: [
          { path: "employee", select: "FirstName LastName Email" },
          { path: "coverBy", select: "FirstName LastName Email" }
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
      select: "FirstName LastName"
    });
    if (!requests) {
      res.status(203).send({
        message: "No leave requests in DB"
      })
    } else {
      requests = requests.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
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

// leaveApp.get("/today/:empId", async (req, res) => {
//   try {
//     const today = new Date();
//     const startDate = new Date(today.setHours(0, 0, 0, 0));
//     let endDate = new Date(today.setHours(23, 59, 59, 999));
//     const leaveData = await Employee.findById({ _id: req.params.empId }, "leaveApplication")
//       .populate({
//         path: "leaveApplication", match:
//           { $gte: startDate, $lte: endDate }
//       })
//   } catch (error) {
//   }
// })

leaveApp.post("/:empId", verifyAdminHREmployeeManagerNetwork, upload.single("prescription"), async (req, res) => {
  try {
    const { empId } = req.params;
    const {
      leaveType,
      fromDate,
      toDate,
      periodOfLeave,
      reasonForLeave,
      coverBy,
      applyFor,
    } = req.body;

    const prescription = req.file?.filename || null;
    const coverByValue = coverBy || null;
    const personId = [undefined, "undefined"].includes(applyFor) ? empId : applyFor;
    const fromDateObj = new Date(fromDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    console.log("fromDateObj: ", fromDateObj);
    console.log("fromDate", fromDate);

    // 1. Handle if applied on behalf of someone else
    if (applyFor) {
      const emp = await Employee.findById(personId, "clockIns").populate({
        path: "clockIns",
        match: { date: { $gte: fromDate, $lte: toDate } },
      });

      if (emp.clockIns.length) {
        return res.status(400).send({ error: "The employee was working during the given leave application date range." });
      }
    }

    // 2. Validate sick leave and casual leave dates
    if (["Sick Leave", "Medical Leave"].includes(leaveType)) {
      const isValid = [today.toDateString(), yesterday.toDateString()].includes(fromDateObj.toDateString());
      if (!isValid) {
        return res.status(400).json({ error: "Sick leave is only applicable for today and yesterday." });
      }
    } else if (["Annual Leave", "Casual Leave"].includes(leaveType)) {
      console.log(fromDateObj.toDateString(), today.toDateString());
      if (fromDateObj.toDateString() === today.toDateString()) {
        return res.status(400).json({ error: `${leaveType} is not applicable for the same day.` });
      }
    }

    // leave application applied person
    const monthStart = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth(), 1);
    const monthEnd = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0);

    const emp = await Employee.findById(personId, "FirstName LastName monthlyPermissions permissionHour typesOfLeaveRemainingDays typesOfLeaveCount leaveApplication")
      .populate([{ path: "admin", select: "FirstName LastName Email" },
      {
        path: "leaveApplication",
        match: { leaveType: "Permission Leave", fromDate: { $gte: monthStart, $lte: monthEnd } },
      }, {
        path: "team",
        populate: [
          { path: "lead", select: "Email" },
          { path: "head", select: "Email" },
          { path: "manager", select: "Email" },
        ],
      }
      ]).exec();

    if (!emp) {
      return res.status(400).json({ error: `No employee found for ID ${empId}` });
    }

    // 3. Permission Leave Validation
    if (leaveType?.toLowerCase()?.includes("permission")) {
      const duration = (new Date(toDate) - new Date(fromDate)) / 60000;
      if (duration > (emp?.permissionHour || 120)) {
        return res.status(400).json({ error: `Permission is only allowed for less than ${emp?.permissionHour || "2"} hours.` });
      }
      if ((emp.leaveApplication?.length || 0) >= (emp?.monthlyPermissions || 2)) {
        return res.status(400).json({ error: `You have already used ${emp.monthlyPermissions} permissions this month.` });
      }
    }

    // 4. Duplicate Check
    const existingRequest = await LeaveApplication.findOne({
      employee: personId,
      status: "approved",
      fromDate: { $gte: req.body.fromDate }
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists for the given date range." });
    }

    // 5. Check Leave Balance
    const approvedLeaves = await LeaveApplication.find({
      leaveType: new RegExp(`^${leaveType}`, "i"),
      status: "approved",
      employee: personId,
    });

    const takenLeaveCount = approvedLeaves.reduce((acc, leave) => acc + getDayDifference(leave), 0);
    const leaveBalance = emp.typesOfLeaveRemainingDays?.[leaveType] || 0;
    if (!leaveType.toLowerCase().includes("permission")) {
      if (leaveBalance < takenLeaveCount) {
        return res.status(400).json({ error: `${leaveType} limit has been reached.` });
      }
    }
    // verify sufficient leave days for leave
    // const balanceLeave = emp.typesOfLeaveRemainingDays?.[leaveType] || 0;
    // const leaveDays = getDayDifference(req.body);
    // if (balanceLeave < leaveDays) {
    //   return res.status(400).send({error: `Insufficient Leave for ${leave}`})
    // }

    // 6. Task Conflict Check
    const deadlineTasks = await Task.find({
      assignedTo: personId,
      to: { $gte: fromDate, $lte: toDate },
    });

    // // 7. CoverBy Check
    // if (coverByValue) {
    //   const reliever = await Employee.findById(coverByValue, "FirstName LastName leaveApplication")
    //     .populate({
    //       path: "leaveApplication",
    //       match: {
    //         fromDate: { $lte: toDate },
    //         toDate: { $gte: fromDate },
    //         leaveType: { $ne: "Permission Leave" },
    //       },
    //     });

    //   if (reliever?.leaveApplication?.length) {
    //     return res.status(400).json({ error: `${reliever.FirstName} is on leave during the selected dates.` });
    //   }
    // }
    let leaveRequest;
    // 8. Validate and Save
    if (![undefined, "undefined"].includes(applyFor)) {
      leaveRequest = {
        leaveType,
        fromDate,
        toDate,
        periodOfLeave,
        reasonForLeave,
        prescription,
        TeamLead: "approved",
        TeamHead: "approved",
        Hr: "approved",
        Manager: "approved",
        status: "approved",
        coverBy: coverByValue,
        employee: personId,
        appliedBy: empId,
      };
      const leaveDaysTaken = Math.max(getDayDifference(leaveRequest), 1);
      emp.typesOfLeaveRemainingDays[leaveType] -= leaveDaysTaken;
      await emp.save();
    } else {
      leaveRequest = {
        leaveType,
        fromDate,
        toDate,
        periodOfLeave,
        reasonForLeave,
        prescription,
        coverBy: coverByValue,
        employee: personId,
        appliedBy: empId,
      };
    }

    const { error } = LeaveApplicationValidation.validate(leaveRequest);
    if (error) return res.status(400).json({ error: error.message });

    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    emp.leaveApplication.push(newLeaveApp._id);
    await emp.save();
    if (!applyFor) {
      // 9. Notifications
      const mailList = [
        emp?.team?.lead?.[0]?.Email,
        emp?.team?.head?.[0]?.Email,
        emp?.team?.manager?.[0]?.Email,
        emp?.admin?.Email,
      ].filter(Boolean);

      sendMail({
        From: process.env.FROM_MAIL,
        To: mailList.join(","),
        Subject: "Leave Application Notification",
        HtmlBody: generateLeaveEmail(emp, fromDate, toDate, reasonForLeave, leaveType, deadlineTasks),
      });
    }

    return res.status(201).json({ message: "Leave request has been submitted successfully.", newLeaveApp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


leaveApp.put('/:id', verifyAdminHREmployee, async (req, res) => {
  try {
    const today = new Date();
    const leaveAppStartedHour = new Date(req.body.fromDate).getHours();
    const startOfDay = new Date(today.setHours((leaveAppStartedHour || 0) - 2, 0, 0, 0));

    const { Hr, TeamLead, TeamHead, Manager, employee, leaveType, ...restBody } = req.body;
    const approvers = [Hr, TeamLead, TeamHead, Manager];

    const allApproved = approvers.every(status => status === 'approved');
    const anyRejected = approvers.some(status => status === 'rejected');

    const emp = await Employee.findById(employee).populate({
      path: "team",
      populate: [
        { path: "lead", select: "FirstName LastName Email" },
        { path: "head", select: "FirstName LastName Email" },
        { path: "manager", select: "FirstName LastName Email" }
      ]
    })
      .populate({ path: "admin", select: "FirstName LastName Email" });

    if (!emp) return res.status(404).send({ error: 'Employee not found.' });
    if (!emp.team) return res.status(404).send({ error: `${emp.FirstName} is not a member of any team. Please add him.` })

    const fromDateValue = new Date(req.body.fromDate);
    const toDateValue = new Date(req.body.toDate);

    if (allApproved) {
      const leaveDaysTaken = Math.max(getDayDifference(req.body), 1);

      if (!emp.typesOfLeaveRemainingDays[leaveType]) {
        return res.status(400).send({ error: 'Invalid leave type.' });
      }

      if (emp.typesOfLeaveRemainingDays[leaveType] < leaveDaysTaken) {
        return res.status(400).send({ error: 'Insufficient leave balance for the requested leave type.' });
      }

      emp.typesOfLeaveRemainingDays[leaveType] -= leaveDaysTaken;
      await emp.save();
    }

    const members = [
      { type: "emp", Email: emp.Email, name: `${emp.FirstName} ${emp.LastName}` },
      emp.team.lead[0] && { type: "lead", Email: emp.team.lead[0].Email, name: `${emp.team.lead[0].FirstName} ${emp.team.lead[0].LastName}` },
      emp.team.head[0] && { type: "head", Email: emp.team.head[0].Email, name: `${emp.team.head[0].FirstName} ${emp.team.head[0].LastName}` },
      emp.team.manager[0] && { type: "manager", Email: emp.team.manager[0].Email, name: `${emp.team.manager[0].FirstName} ${emp.team.manager[0].LastName}` },
      emp.admin && { type: "admin", Email: emp.admin.Email, name: `${emp.admin.FirstName} ${emp.admin.LastName}` }
    ].filter(Boolean);

    const updatedLeaveApp = {
      ...restBody,
      Hr,
      TeamHead,
      TeamLead,
      Manager,
      status: allApproved ? "approved" : anyRejected ? "rejected" : restBody.status
    };

    const updatedRequest = await LeaveApplication.findOneAndUpdate(
      { _id: req.params.id, fromDate: { $gt: startOfDay } },
      updatedLeaveApp,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(400).send({ error: 'Leave request has expired.' });
    }

    const actionBy = Hr === "approved" ? "HR" :
      TeamHead === "approved" ? "TeamHead" :
        TeamLead === "approved" ? "TeamLead" : "Manager";

    const emailType = allApproved ? "approved" : "rejected";
    members.forEach(member => {
      sendMail({
        From: process.env.FROM_MAIL,
        To: member.Email,
        Subject: "Leave Application Response",
        HtmlBody: mailContent(emailType, fromDateValue, toDateValue, emp, leaveType, actionBy, member)
      });
    });

    return res.send({
      message: 'You have responded to the leave application.',
      data: updatedRequest
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'An error occurred while processing the request.' });
  }
});

leaveApp.delete("/:id/:leaveId", verifyEmployee, async (req, res) => {
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
