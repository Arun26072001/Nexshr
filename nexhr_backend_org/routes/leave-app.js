const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const nodemailer = require("nodemailer");
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyEmployee, verifyAdmin, verifyAdminHREmployee, verifyAdminHR } = require('../auth/authMiddleware');
const { Position } = require('../models/PositionModel');
const { Team } = require('../models/TeamModel');
const { upload } = require('./imgUpload');
const now = new Date();

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);
}

leaveApp.get("/emp/:empId", verifyAdminHREmployee, async (req, res) => {
  try {
    const { empId } = req.params;

    // Fetch employee data
    const emp = await Employee.findById(empId, "annualLeaveYearStart position FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays")
      .populate("position")
      .exec();

    if (!emp) {
      return res.status(404).send({ message: "Employee not found!" });
    }

    const annualLeaveYearStart = new Date(emp.annualLeaveYearStart);
    const now = new Date();

    // Define start and end dates for leave filter
    const startDate =
      annualLeaveYearStart.getFullYear() > now.getFullYear() - 1
        ? new Date(now.getFullYear(), annualLeaveYearStart.getMonth(), annualLeaveYearStart.getDate())
        : new Date(annualLeaveYearStart.getFullYear(), annualLeaveYearStart.getMonth(), annualLeaveYearStart.getDate());

    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
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
    const positionName = emp.position[0]?.PositionName;

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

leaveApp.get("/lead/:id", verifyEmployee, async (req, res) => {
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
    const team = await Team.findOne({ lead: req.params.id }).exec();
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

leaveApp.get("/head/:id", verifyEmployee, async (req, res) => {
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
    const team = await Team.findOne({ head: req.params.id }).exec();
    if (!team) {
      return res.status(404).send({ error: "You are not head in any team" })
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
      teamLeaves = teamLeaves.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
      teamLeaves = teamLeaves.map((leave) => {
        return leave, leave.prescription
          ? `${process.env.REACT_APP_API_URL}/uploads/${leaveReq.prescription}`
          : null
      })
      res.send(teamLeaves)

      // const approvedLeave = teamLeaves.filter(data => data.status === "approved");
      // const pendingLeave = teamLeaves.filter(data => data.status === "pending");
      // const upComingLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() > new Date().getTime())
      // const peoplesOnLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() === new Date().getTime())
      // const takenLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() < new Date().getTime())
      // res.send({ leaveData: teamLeaves, pendingLeave, upComingLeave, peoplesOnLeave, takenLeave });
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

// get all leave requests from all employees

leaveApp.get("/:id", verifyHREmployee, async (req, res) => {
  try {
    const leaveReq = await LeaveApplication.findById(req.params.id);

    if (!leaveReq) {
      return res.status(404).send({ message: "Leave application not found" }); // Changed to 404 for "not found"
    }

    // Construct the prescription URL if the prescription field exists
    const prescriptionUrl = leaveReq.prescription
      ? `${process.env.REACT_APP_API_URL}/uploads/${leaveReq.prescription}`
      : null;

    // Create the updated response object
    const updatedLeaveData = {
      ...leaveReq.toObject(), // Convert Mongoose document to plain object
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

// to get leave range date of data
leaveApp.get("/date-range/:empId", verifyAdminHREmployee, async (req, res) => {
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
      res.send(requests);
    }
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error", details: err.message })
  }
});

leaveApp.post("/:empId", verifyAdminHREmployee, upload.single("prescription"), async (req, res) => {
  try {
    // Handle empty `coverBy` value
    req.body.coverBy = req.body.coverBy === "" ? null : req.body.coverBy;

    // Construct the leave request object
    const leaveRequest = {
      leaveType: req.body.leaveType.toLowerCase(),
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      periodOfLeave: req.body.periodOfLeave,
      reasonForLeave: req.body.reasonForLeave,
      prescription: req.file ? req.file.filename : null, // Save file name
      coverBy: req.body.coverBy,
      employee: req.params.empId,
    };

    if (leaveRequest.leaveType.includes("sick") || leaveRequest.leaveType.includes("medical")) {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      // Convert fromDate to a Date object
      const fromDate = new Date(leaveRequest.fromDate);

      // Remove time from dates for comparison
      const isTodayOrYesterday =
        fromDate.toDateString() === today.toDateString() ||
        fromDate.toDateString() === yesterday.toDateString();

      if (!isTodayOrYesterday) {
        return res.status(400).send({
          error: "Sick leave is only applicable for today or yesterday.",
        });
      }
    }

    // Check if there are pending leaves for the same type
    const pendingLeaveData = await LeaveApplication.find({
      leaveType: { $regex: new RegExp("^" + req.body.leaveType, "i") },
      status: "pending",
      employee: req.params.empId,
    });

    // if (pendingLeaveData.length > 0) {
    //   return res.status(400).send({ error: "Please wait for the previous leave response!" });
    // }

    // Fetch approved leave data for calculating taken leave count
    const approvedLeaveData = await LeaveApplication.find({
      leaveType: { $regex: new RegExp("^" + req.body.leaveType, "i") },
      status: "approved",
      employee: req.params.empId,
    });

    const takenLeaveCount = approvedLeaveData.reduce(
      (acc, leave) => acc + getDayDifference(leave),
      0
    );

    // Fetch employee leave data
    const empData = await Employee.findById(req.params.empId)
      .populate({
        path: "team",
        populate: [
          {
            path: "lead",
            select: "Email"
          },
          {
            path: "head",
            select: "Email"
          }
        ]
      });
    if (!empData) {
      return res.status(400).send({ error: `No employee found for ID ${req.params.empId}` });
    }

    const relievingOffData = await Employee.findById(req.body.coverBy, "Email FirstName LastName");
    const leaveTypeName = req.body.leaveType;

    const leaveDaysCount = empData?.typesOfLeaveRemainingDays[leaveTypeName] || 0;

    if (leaveDaysCount <= takenLeaveCount) {
      return res.status(400).send({ error: `${leaveTypeName} leave limit reached.` });
    }

    // Check if leave request for the same date already exists
    const existingRequest = await LeaveApplication.findOne({
      fromDate: leaveRequest.fromDate,
      employee: req.params.empId,
    });
    if (existingRequest) {
      return res.status(400).send({ error: "Already sent a request on this date." });
    }

    // Validate the leave request
    const { error } = LeaveApplicationValidation.validate(leaveRequest);
    if (error) {
      console.error("Validation Error:", error);
      return res.status(400).send({ error: error.message });
    }

    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    empData.leaveApplication.push(newLeaveApp._id);
    await empData.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.FROM_MAIL,
        pass: process.env.MAILPASSWORD,
      },
    });

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
                 <h1>${empData.FirstName} ${empData.LastName} has been apply leave for ${req.body.fromDate} - ${req.body.toDate}</h1>
               </div>
               <div class="content">
                   <p>Hi all,</p>
                   <p>I have apply leave for ${req.body.fromDate} - ${req.body.toDate}, due to ${req.body.reasonForLeave}. Please response for that </p>
                   <p>Thank you!</p>
               </div>
             </div>
           </body>
           </html>
         `;
    const mailList = [
      empData.team.lead.Email,
      empData.team.head.Email
    ]
    await transporter.sendMail({
      from: process.env.FROM_MAIL,
      to: mailList,
      subject: "Leave Application Notification",
      html: htmlContent,
    });

    if (req.body.coverBy) {
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
               .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
             </style>
           </head>
           <body>
             <div class="container">
               <div class="header">
                 <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Logo" />
                 <h1>${empData.FirstName} has assigned a task to ${relievingOffData.FirstName}</h1>
               </div>
               <div class="content">
                   <p>Hi ${relievingOffData.FirstName},</p>
                   <p>${empData.FirstName} has assigned some tasks to you during their leave period. Please take note.</p>
                   <p>Thank you!</p>
               </div>
               <div class="footer">
                 <p>Need help? <a href="mailto:webnexs29@gmail.com">Contact our Team Head</a>.</p>
               </div>
             </div>
           </body>
           </html>
         `;

      await transporter.sendMail({
        from: process.env.FROM_MAIL,
        to: relievingOffData.Email,
        subject: "Task Relieving Request",
        html: htmlContent,
      });
    }

    return res.status(201).send({ message: "Leave Request has been sent to Higher Authority." });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.message });
  }
});

leaveApp.put('/:id', verifyHREmployee, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const { Hr, TeamLead, TeamHead, employee, leaveType, ...restBody } = req.body;
    const approvers = [Hr, TeamLead, TeamHead];

    // Determine application status
    const allApproved = approvers.every(status => status === 'approved');
    const anyRejected = approvers.some(status => status === 'rejected');

    // Update leave balance if fully approved
    if (allApproved) {
      const emp = await Employee.findById(employee);
      if (!emp) {
        return res.status(404).send({ error: 'Employee not found.' });
      }

      // Calculate leave days to deduct
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

    if (!updatedRequest) {
      return res.status(400).send({ error: 'Leave request has expired.' });
    }

    return res.send({
      message: 'You have replied to the leave application.',
      data: updatedRequest,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'An error occurred while processing the request.' });
  }
});


leaveApp.delete("/:empId/:leaveId", verifyEmployee, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.empId);
    if (!emp) {
      res.status(404).send({ message: "Employee not found in this ID" })
    }
    else {
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
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Error in delete Leave request", details: err.message })
  }
})

module.exports = { leaveApp, getDayDifference };