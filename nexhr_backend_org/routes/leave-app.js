const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyEmployee, verifyAdmin, verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdminHREmployee } = require('../auth/authMiddleware');
const { Position } = require('../models/PositionModel');
const { Team } = require('../models/TeamModel');
const { upload } = require('./imgUpload');
const now = new Date();
const sendMail = require("./mailSender");

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);
}

// Helper function to generate leave request email content
function generateLeaveEmail(empData, fromDate, toDate, reasonForLeave) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NexsHR</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
        .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${empData.FirstName} ${empData.LastName} has applied for leave (${fromDate} - ${toDate})</h1>
        <p>Reason: ${reasonForLeave}</p>
        <p>Please respond accordingly.</p>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate coverBy email content
function generateCoverByEmail(empData, relievingOffData) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NexsHR</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
        .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${empData.FirstName} has assigned tasks to ${relievingOffData.FirstName}</h1>
        <p>Hi ${relievingOffData.FirstName},</p>
        <p>${empData.FirstName} has assigned some tasks to you during their leave period.</p>
        <p>Thank you!</p>
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

    // const { fromDate, toDate, reasonForLeave } = req.body; // Destructure request body

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
            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding: 20px; }
            .header img { max-width: 100px; }
            .content { margin: 20px 0; }
            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
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
          To: mailList,
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
          From: "employees", // Replace with your employee collection name
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $project: {
          leaveType: 1,  // Include the leaveType field
          fromDate: 1,  // Include the fromDate field
          toDate: 1,  // Include the toDate field
          periodOfLeave: 1,  // Default "full day" if periodOfLeave is null
          reasonForLeave: 1,  // Default "fever" if reasonForLeave is null
          prescription: 1,  // Include the prescription field
          employee: 1,  // Include the employee reference
          coverBy: 1,  // Include the coverBy field
          "employeeDetails.FirstName": 1,  // Include employee's FirstName
          "employeeDetails.LastName": 1,  // Include employee's LastName
          "employeeDetails.Email": 1  // Include employee's Email
        },
      },
    ]);

    if (leaves.length > 0) {
      leaves.map(async (leave) => {
        const updatedLeave = {
          leaveType: leave.leaveType,
          fromDate: leave.fromDate,
          toDate: leave.toDate,  // Include the toDate field
          periodOfLeave: leave.periodOfLeave,  // Default "full day" if periodOfLeave is null
          reasonForLeave: leave.reasonForLeave,  // Default "fever" if reasonForLeave is null
          prescription: leave.prescription,  // Include the prescription field
          employee: leave.employee,  // Include the employee reference
          coverBy: leave.coverBy,
          status: "rejected",
          TeamLead: "rejected",
          Hr: "rejected",
          TeamHead: "rejected"
        }
        const updateLeave = await LeaveApplication.findByIdAndUpdate(leave._id, updatedLeave, { new: true });
        // Prepare and send the email
        const htmlContent = `
               <!DOCTYPE html>
               <html lang="en">
               <head>
                 <meta charset="UTF-8">
                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
                 <title>NexsHR</title>
                 <style>
                   body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                   .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                   .header { text-align: center; padding: 20px; }
                   .header img { max-width: 100px; }
                   .content { margin: 20px 0; }
                   .important {font-color:rgb(248, 73, 73), font-weight: bold;  }
                   .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
                 </style>
               </head>
               <body>
                 <div class="container">
                   <div class="header">
                     <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Logo" />
                     <h1>Leave application(${leave.fromDate} - ${leave.toDate}) has been rejected!</h1>
                   </div>
                   <div class="content">
                       <p>Hi ${employeeDetails.FirstName},</p>
                       <p>Your leave application has been rejected by higher authority.</p>
                       <p class='important'>If you take leave, It will deduct your salary!</p>
                       <p>Thank you!</p>
                   </div>
                   <div class="footer">
                     <p>Need help? <a href="mailto:webnexs29@gmail.com">Contact our Team Head</a>.</p>
                   </div>
                 </div>
               </body>
               </html>
             `;

        sendMail({
          From: process.env.FROM_MAIL,
          To: employeeDetails.Email,
          Subject: "Leave Application Rejected",
          HtmlBody: htmlContent,
        });

      })
    }
  } catch (error) {
    console.error("Error fetching leave applications:", error);
    res.status(500).send({ error: "An error occurred while fetching data." });
  }
});

// get employee of all leave application From annualLeaveYearStart date
leaveApp.get("/emp/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { empId } = req.params;

    // Fetch employee data
    const emp = await Employee.findById(empId, "annualLeaveYearStart position FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays")
      .populate("position")
      .exec();

    if (!emp) {
      return res.status(404).send({ message: "Employee not found!" });
    }
    let startDate, endDate;

    if (req?.query?.daterangeValue) {
      startDate = new Date(req.query.daterangeValue[0]);
      endDate = new Date(req.query.daterangeValue[1]);
      // Include the full last day of the range
      // endDate.setHours(23, 59, 59, 999);
    }

    const annualLeaveYearStart = new Date(emp.annualLeaveYearStart);
    const now = new Date();

    // Define start and end dates for leave filter
    startDate =
      annualLeaveYearStart.getFullYear() > now.getFullYear() - 1
        ? new Date(now.getFullYear(), annualLeaveYearStart.getMonth(), annualLeaveYearStart.getDate())
        : new Date(annualLeaveYearStart.getFullYear(), annualLeaveYearStart.getMonth(), annualLeaveYearStart.getDate());

    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
    endDate.setHours(23, 59, 59, 999);
    // Fetch leave requests within the defined range
    const leaveReqs = await LeaveApplication.find({
      employee: empId,
      fromDate: { $gte: startDate, $lte: endDate }
    })
      .populate({ path: "employee", select: "FirstName LastName" })
      .exec();

    let leaveApplications = leaveReqs.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));

    leaveApplications = leaveApplications.map((leave) => {
      return {
        ...leave.toObject(),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }
    })

    // Fetch colleagues in the same position
    const positionName = emp.position?.PositionName;

    let colleagues = [];
    if (positionName) {
      const positionIds = await Position.find({ PositionName: positionName }, "_id").exec();
      colleagues = await Employee.find(
        { position: { $in: positionIds }, _id: { $ne: empId } },
        "FirstName LastName Email phone"
      ).exec();
    }

    // Fetch people on leave today
    const today = new Date().toISOString().split("T")[0];
    const peopleOnLeave = await LeaveApplication.find({
      fromDate: { $lte: today },
      toDate: { $gte: today },
      status: "approved"
    })
      .populate({ path: "employee", select: "FirstName LastName" })
      .exec();

    // Fetch team members' leaves this month
    const team = await Team.findOne({ employees: empId }, "employees").exec();
    let peopleLeaveOnMonth = [];
    if (team) {
      peopleLeaveOnMonth = await LeaveApplication.find({
        employee: { $in: team.employees },
        fromDate: { $lte: endDate },
        toDate: { $gte: startDate },
        status: "approved"
      }).exec();

      peopleLeaveOnMonth = peopleLeaveOnMonth.map((leave) => {
        return {
          ...leave.toObject(),
          prescription: leave.prescription
            ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
            : null
        }
      })
    }
    // Respond with aggregated data
    res.send({
      employee: emp,
      leaveApplications,
      colleagues,
      peopleOnLeave,
      peopleLeaveOnMonth
    });
  } catch (err) {
    console.error("Error fetching employee data:", err);
    res.status(500).send({ message: "Internal server error", details: err.message });
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
    empLeaveReqs = empLeaveReqs.map((leave) => {
      return {
        ...leave.toObject(),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }
    })
    res.send(empLeaveReqs);
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res.status(500).send({ message: "Internal Server Error", details: err.message });
  }
});

leaveApp.get("/team/:id", verifyEmployee, async (req, res) => {
  try {
    let startOfMonth;
    let endOfMonth;

    if (req?.query?.daterangeValue) {
      startOfMonth = new Date(req.query.daterangeValue[0]);
      endOfMonth = new Date(req.query.daterangeValue[1]);
    } else {
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    const who = req?.query?.who;
    const team = await Team.findOne({ [who]: req.params.id }).exec();
    if (!team) {
      return res.status(404).send({ error: "You are not lead in any team" })
    } else {
      const { employees } = team;
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
      res.send({ leaveData: teamLeaves, pendingLeave, upComingLeave, peoplesOnLeave, takenLeave });
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
    leaveData = leaveData.map((leave) => {
      return {
        ...leave.toObject(),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }
    })

    res.send({
      leaveData
    });
  } catch (err) {
    console.error("Error fetching leave data:", err);
    res.status(500).send({ error: err.message });
  }
})

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
  let startOfMonth;
  let endOfMonth;

  if (req?.query?.daterangeValue) {
    startOfMonth = new Date(req.query.daterangeValue[0]);
    endOfMonth = new Date(req.query.daterangeValue[1]);
    // Include the full last day of the range
    endOfMonth.setHours(23, 59, 59, 999);
  } else {
    const now = new Date(); // Define "now" for current date logic
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Include the full last day of the month
    endOfMonth.setHours(23, 59, 59, 999);
  }

  try {
    // Fetch leave data for employees with Account 3
    const employeesLeaveData = await Employee.find({ Account: 3 }, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          },
          toDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        },
        populate: { path: "employee", select: "FirstName LastName" }
      });

    // Flatten leaveApplication data
    let leaveData = employeesLeaveData.map(data => data.leaveApplication).flat();
    leaveData = leaveData.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
    leaveData = leaveData.map((leave) => {
      return {
        ...leave.toObject(),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }
    })
    // Filter and calculate leave data
    const approvedLeave = leaveData.filter(data => data.status === "approved");
    const leaveInHours = approvedLeave.reduce((total, data) => total + getDayDifference(data) * 9, 0);
    const pendingLeave = leaveData.filter(data => data.status === "pending");
    const upComingLeave = leaveData.filter(data => new Date(data.date).getTime() > new Date().getTime());
    const peoplesOnLeave = approvedLeave.filter(data => new Date(data.date).toDateString() === new Date().toDateString());

    res.send({
      leaveData,
      approvedLeave,
      peoplesOnLeave,
      pendingLeave,
      upComingLeave,
      leaveInHours
    });
  } catch (err) {
    console.error("Error fetching leave data:", err);
    res.status(500).send({ error: err.message });
  }
});

//get all employees of leave application in month
leaveApp.get("/date-range/admin", verifyAdmin, async (req, res) => {

  let startOfMonth;
  let endOfMonth;
  if (req?.query?.daterangeValue) {
    startOfMonth = new Date(req.query.daterangeValue[0]);
    endOfMonth = new Date(req.query.daterangeValue[1]);
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  try {
    // if a person has account 2, can get date range of all emp leave data
    const employeesLeaveData = await Employee.find({}, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          },
          toDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        },
        populate: { path: "employee", select: "FirstName LastName" }
      });

    let leaveData = employeesLeaveData.map(data => data.leaveApplication).flat();
    leaveData = leaveData.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
    leaveData = leaveData.map((leave) => {
      return {
        ...leave.toObject(),
        prescription: leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
          : null
      }
    })
    const approvedLeave = leaveData.filter(data => data.status === "approved");
    const leaveInHours = approvedLeave.reduce((total, data) => total + getDayDifference(data) * 9, 0);
    const pendingLeave = leaveData.filter(data => data.status === "pending");
    const upComingLeave = leaveData.filter(data => new Date(data.date).getTime() > new Date().getTime())
    const peoplesOnLeave = approvedLeave.filter(data => new Date(data.date).getTime() === new Date().getTime())
    res.send({ leaveData, approvedLeave, peoplesOnLeave, pendingLeave, upComingLeave, leaveInHours });
  } catch (err) {
    res.status(500).send({ errpr: err.message })
  }
})

// To get leave range date of data
leaveApp.get("/date-range/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  const now = new Date();
  let startOfMonth;
  let endOfMonth;
  if (req?.query?.daterangeValue) {
    startOfMonth = new Date(req.query.daterangeValue[0]);
    endOfMonth = new Date(req.query.daterangeValue[1]);
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // const Header = req.headers["authorization"]
  // jwt.verify(Header, jwtKey, async (err, authData) => {
  try {
    // if a person has account 3, can get date range of his leave data
    const employeeLeaveData = await Employee.findById(req.params.empId, "_id FirstName LastName")
      .populate({
        path: "leaveApplication",
        match: {
          fromDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          },
          toDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        },
        populate: { path: "employee", select: "FirstName LastName" } // need name in table
      });

    if (employeeLeaveData?.leaveApplication.length > 0) {
      let leaveData = employeeLeaveData.leaveApplication.map(data => data).flat();
      leaveData = leaveData.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));


      leaveData = leaveData.map((leave) => {
        return {
          ...leave.toObject(),
          prescription: leave.prescription
            ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}`
            : null
        }
      })
      const approvedLeave = leaveData.filter(data => data.status === "approved");
      const leaveInHours = approvedLeave.reduce((total, data) => total + getDayDifference(data) * 9, 0);
      const pendingLeave = leaveData.filter(data => data.status === "pending");
      const upComingLeave = leaveData.filter(data => new Date(data.date).getTime() > new Date().getTime())
      const peoplesOnLeave = approvedLeave.filter(data => new Date(data.date).getTime() === new Date().getTime())
      res.send({ leaveData, approvedLeave, peoplesOnLeave, pendingLeave, upComingLeave, leaveInHours });
    } else {
      res.send({
        leaveData: [],
        approvedLeave: [],
        peoplesOnLeave: [],
        pendingLeave: [],
        upComingLeave: [],
        leaveInHours: 0
      })
    }

  } catch (err) {
    res.status(500).send({ message: "Error in getting emp of leave reqests", details: err.message })
  }
})

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
      console.log(requests.length);

      res.send(requests);
    }
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error", details: err.message })
  }
});

leaveApp.get("/today/:empId", async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    let endDate = new Date(today.setHours(23, 59, 59, 999));
    const leaveData = await Employee.findById({ _id: req.params.empId }, "leaveApplication")
      .populate({
        path: "leaveApplication", match:
          { $gte: startDate, $lte: endDate }
      })
  } catch (error) {

  }
})

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
    } = req.body;

    // const leaveType = leaveType.toLowerCase();
    const prescription = req.file ? req.file.filename : null;

    // Ensure `coverBy` is either null or a valid value
    const coverByValue = coverBy === "" ? null : coverBy;

    // Construct leave request object
    const leaveRequest = {
      leaveType,
      fromDate,
      toDate,
      periodOfLeave,
      reasonForLeave,
      prescription,
      coverBy: coverByValue,
      employee: empId,
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const fromDateObj = new Date(fromDate);

    // Handle sick leave restriction
    if (["Sick Leave", "Medical Leave"].includes(leaveType)) {
      const isTodayOrYesterday =
        fromDateObj.toDateString() === today.toDateString() ||
        fromDateObj.toDateString() === yesterday.toDateString();

      if (isTodayOrYesterday) {
        return res.status(400).json({ error: "Sick leave is only applicable for today and yesterday." });
      }
    } else if (["Annual Leave", "Casual Leave"].includes(leaveType)) {
      const isToday = fromDateObj.toDateString() === today.toDateString();
      if (isToday) {
        return res.status(400).send({ error: `${leaveType} is not applicable for same day` })
      }
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const emp = await Employee.findById(empId, "_id monthlyPermissions permissionHour")
      .populate({
        path: "leaveApplication",
        match: { leaveType: "Permission Leave", fromDate: { $gte: startDate, $lte: endDate } },
      })
      .populate({
        path: "team",
        populate: [{ path: "lead", select: "Email" }, { path: "head", select: "Email" }],
      }).exec();
    if (!emp) {
      return res.status(400).json({ error: `No employee found for ID ${empId}` });
    }
    // Handle permission leave restrictions
    if (leaveType.includes("Permission Leave")) {
      const permissionTime = (new Date(toDate) - new Date(fromDate)) / 60000;

      if (permissionTime > emp?.permissionHour || 120) {
        return res.status(400).json({ error: `Permission is only approved for up to ${emp?.permissionHour || "2"} hours.` });
      }
      if (emp.leaveApplication.length >= emp?.monthlyPermissions) {
        return res.status(400).json({ error: "You have already used 2 permissions this month." });
      }
    }

    // Check if leave request for the same date already exists
    const existingRequest = await LeaveApplication.findOne({
      fromDate,
      toDate,
      employee: empId,
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already submitted for this date." });
    }

    // Fetch approved leave count for the requested leave type
    const approvedLeaveData = await LeaveApplication.find({
      leaveType: new RegExp("^" + leaveType, "i"),
      status: "approved",
      employee: empId,
    });

    const takenLeaveCount = approvedLeaveData.reduce((acc, leave) => acc + getDayDifference(leave), 0);

    // Fetch employee data including team leads and heads
    // const empData = await Employee.findById(empId)
    //   .populate({
    //     path: "team",
    //     populate: [{ path: "lead", select: "Email" }, { path: "head", select: "Email" }],
    //   });


    if (leaveType !== "Permission Leave") {
      const leaveDaysCount = emp?.typesOfLeaveRemainingDays?.[leaveType] || 0;
      if (leaveDaysCount < takenLeaveCount) {
        return res.status(400).json({ error: `${leaveType} limit reached.` });
      }
    }

    // Validate leave request schema
    const { error } = LeaveApplicationValidation.validate(leaveRequest);
    if (error) {
      console.error("Validation Error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Save leave request and update employee leave list
    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    emp.leaveApplication.push(newLeaveApp._id);
    await emp.save();

    // Send notification emails
    const mailList = [
      emp?.team?.lead?.Email,
      emp?.team?.head?.Email,
    ].filter(Boolean);

    sendMail({
      From: process.env.FROM_MAIL,
      To: mailList,
      Subject: "Leave Application Notification",
      HtmlBody: generateLeaveEmail(emp, fromDate, toDate, reasonForLeave),
    });

    // If coverBy is assigned, notify the relieving officer
    if (coverByValue) {
      const relievingOffData = await Employee.findById(coverByValue, "Email FirstName LastName");
      if (relievingOffData) {
        sendMail({
          From: process.env.FROM_MAIL,
          To: relievingOffData.Email,
          Subject: "Task Relieving Request",
          HtmlBody: generateCoverByEmail(emp, relievingOffData),
        });
      }
    }

    return res.status(201).json({ message: "Leave request has been sent to higher authority.", newLeaveApp });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

leaveApp.put('/:id', verifyAdminHREmployee, async (req, res) => {
  try {
    const today = new Date();
    const leaveAppStartedHour = new Date(req.body.fromDate).getHours()

    const startOfDay = new Date(today.setHours((leaveAppStartedHour || 0) - 2, 0, 0, 0));

    const { Hr, TeamLead, TeamHead, employee, leaveType, ...restBody } = req.body;
    const approvers = [Hr, TeamLead, TeamHead];

    // Determine application status
    const allApproved = approvers.every(status => status === 'approved');
    const anyRejected = approvers.some(status => status === 'rejected');

    const emp = await Employee.findById(employee);
    if (!emp) {
      return res.status(404).send({ error: 'Employee not found.' });
    }
    // Update leave balance if fully approved
    if (allApproved) {

      // Calculate leave days To deduct
      const leaveDaysTaken = Math.max(getDayDifference(req.body), 1);
      // const leaveTypeKey = leaveType.split(' ')[0];

      if (!emp.typesOfLeaveRemainingDays[leaveType]) {
        return res.status(400).send({ error: 'Invalid leave type.' });
      }

      emp.typesOfLeaveRemainingDays[leaveType] -= leaveDaysTaken;
      // emp.annualLeaveEntitlement -= leaveDaysTaken

      // Prevent negative leave balances
      if (emp.typesOfLeaveRemainingDays[leaveType] < 0) {
        return res.status(400).send({
          error: 'Insufficient leave balance for the requested leave type.',
        });
      }

      await emp.save();
    }

    // Prepare updated leave application data
    const updatedLeaveApp = {
      ...restBody,
      Hr, TeamHead, TeamLead,
      status: allApproved ? "approved" : anyRejected ? "rejected" : restBody.status,
    };

    // Update leave application and ensure it's not expired
    const updatedRequest = await LeaveApplication.findOneAndUpdate(
      {
        _id: req.params.id,
        fromDate: { $gt: startOfDay },
      },
      updatedLeaveApp,
      { new: true }
    );

    function mailContent(type, fromDateValue, toDateValue) {
      const isRejected = type === "rejected";
      const actionBy = Hr === "rejected" ? "HR" : TeamHead === "rejected" ? "TeamHead" : TeamLead === "rejected" ? "TeamLead" : "Manager";
      const subject = isRejected
        ? `${emp.FirstName}'s Leave Application has been rejected by ${actionBy}`
        : `${emp.FirstName}'s Leave Application has been approved by ${actionBy}`;

      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" as="style" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />
            <title>Leave Application ${isRejected ? "Rejection" : "Approval"} Email</title>
            <style>
              * {
                font-family: "Inter", sans-serif;
                font-display: swap;
              }
              .parent {
                width: 100%;
                height: 100vh;
                display: flex;
                justify-content: center ;
                align-items: center;
              }
              .content {
                border: 1px solid gray;
                border-radius: 10px;
                padding: 50px;
                width: fit-content;
                height: fit-content;
                text-align: left;
                background-color: #fff;
              }
              .underline {
                border-bottom: 3px solid ${isRejected ? "red" : "green"};
                width: 30px;
              }
              .mailButton {
                font-weight: bold;
                padding: 15px 30px;
                border-radius: 30px;
                background-color: ${isRejected ? "red" : "green"};
                color: white !important;
                margin: 15px 0px;
                border: none;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
              }
              p {
                color: #686D76 !important;
                margin: 10px 0px;
              }
              .container {
                text-align: center;
              }
              img {
                width: 100px;
                height: 100px;
                object-fit: cover;
              }
            </style>
          </head>
          <body>
            <div style="text-align: center;">
              <img src="logo.png" alt="logo">
              <div class="parent">
                <div class="content">
                  <p style="margin: 15px 0px; font-size: 23px; font-weight: 500; color: black;">Hi ${emp.FirstName} ${emp.LastName},</p>
                  <div class="underline"></div>
                  <p style="margin: 25px 0px; font-size: 15px; font-weight: 500;">
                    ${subject}
                  </p>
                  <h3 style="margin: 15px 0px; color: #686D76;">Details,</h3>
                  <p>
                    ${req.body.leaveType} from 
                    ${fromDateValue.toLocaleString("default", { month: "long" })} ${fromDateValue.getDate()}, ${fromDateValue.getFullYear()} 
                    to 
                    ${toDateValue.toLocaleString("default", { month: "long" })} ${toDateValue.getDate()}, ${toDateValue.getFullYear()}
                  </p>
                  <a href="${process.env.FRONTEND_URL}" class="mailButton">
                    View factorial
                  </a>
                  <p style="font-weight: 500; font-size: 15px; color: #B4B4B8">
                    Why did you receive this mail?
                  </p>
                  <p style="font-weight: 500; color: #B4B4B8;">
                    Because you are the applied person for this leave.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const fromDateValue = new Date(req.body.fromDate);
    const toDateValue = new Date(req.body.toDate);
    if (updatedRequest.status === "approved") {
      sendMail({
        From: process.env.FROM_MAIL,
        To: emp.Email,
        Subject: "Leave Application Reponse",
        HtmlBody: mailContent("approved", fromDateValue, toDateValue),
      });
    } else if (anyRejected) {
      sendMail({
        From: process.env.FROM_MAIL,
        To: emp.Email,
        Subject: "Leave Application Reponse",
        HtmlBody: mailContent("rejected", fromDateValue, toDateValue),
      });
    }

    if (!updatedRequest) {
      return res.status(400).send({ error: 'Leave request has expired.' });
    }

    return res.send({
      message: 'You have replied To the leave application.',
      data: updatedRequest,
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
            return leaveId != req.params.leaveId
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