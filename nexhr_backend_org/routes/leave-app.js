const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel');
const nodemailer = require("nodemailer");
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyEmployee, verifyAdmin, verifyAdminHREmployee } = require('../auth/authMiddleware');
const { Position } = require('../models/PositionModel');
const { Team } = require('../models/TeamModel');

const now = new Date();

function getDayDifference(leave) {
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference / (1000 * 60 * 60 * 24);
}

leaveApp.get("/emp/:empId", verifyAdminHREmployee, async (req, res) => {
  try { //verifyHREmployee this API is use for emp and Hr to fetch their leave reqs
    let requests = await Employee.findById(req.params.empId, "_id FirstName LastName Email phone typesOfLeaveCount typesOfLeaveRemainingDays")
      .populate({
        path: "leaveApplication",
        populate: {
          path: "employee",
          select: "FirstName LastName"
        }
      })
      .populate({
        path: "position"
      })
      .exec();

    // Convert Mongoose document to plain JavaScript object
    requests = requests.toObject();

    // const typesOfLeaveTaken = requests.leaveApplication.reduce((acc, leave) => {
    //   if (leave.status === "approved") {
    //     const dayDifference = getDayDifference(leave)

    //     // Check if the leave type already exists in the accumulator
    //     const existingLeave = acc.find((data) => data.leaveType === leave.leaveType);
    //     if (existingLeave) {
    //       // If it exists, update the takenLeaveCount
    //       existingLeave.takenLeaveCount += dayDifference;
    //     } else {
    //       // If it doesn't exist, add a new entry to the accumulator
    //       acc.push({ leaveType: leave.leaveType, takenLeaveCount: dayDifference });
    //     }
    //   } else {
    //     // Handle cases where the leave is not approved
    //     const existingLeave = acc.find((data) => data.leaveType === leave.leaveType);
    //     if (!existingLeave) {
    //       acc.push({ leaveType: leave.leaveType, takenLeaveCount: 0 });
    //     }
    //   }

    //   return acc;
    // }, []); // Start with an empty array

    // // Add the new property to the object
    // requests.takenLeaveCount = typesOfLeaveTaken;

    const positionIds = await Position.find({ PositionName: requests?.position[0].PositionName }, "_id");
    const collegues = await Employee.find({
      position: { $in: positionIds },
      _id: { $nin: [req.params.empId] }
    }, "FirstName LastName Email phone");

    const empIds = await Employee.find({ Account: 3, _id: { $nin: req.params.empId } });
    const peopleOnLeave = await LeaveApplication.find(
      { employee: { $in: empIds }, fromDate: new Date().toISOString().split("T")[0], status: "approved" }
      , "_id fromDate toDate").populate({ path: "employee", select: "_id FirstName LastName" })

    const teamMembers = await Team.findOne({ employees: { $in: req.params.empId } }, "employees").exec();
    let peopleLeaveOnMonth;
    if (teamMembers?._id) {
      peopleLeaveOnMonth = await LeaveApplication.find(
        {
          employee: { $in: teamMembers.employees },
          fromDate: {
            $gte: new Date().toISOString().split("T")[0],
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          },
          toDate: {
            $gte: new Date().toISOString().split("T")[0],
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          },
          status: "approved"
        }
        , "fromDate toDate");
    } else {
      peopleLeaveOnMonth = []
    }
    res.send({ requests, collegues, peopleOnLeave, peopleLeaveOnMonth });

    if (!requests || !collegues || !peopleOnLeave) {
      res.status(404).send({ message: "requests or collegues or peopleOnLeave something not found!" })
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal sever error", details: err.message })
  }

});

// get all leave request from emp and hr
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
    let empLeaveReqs = leaveReqs.map((req) => (
      req.leaveApplication
    )).flat()
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
      const teamLeaves = await LeaveApplication.find({
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
      const approvedLeave = teamLeaves.filter(data => data.status === "approved");
      const pendingLeave = teamLeaves.filter(data => data.status === "pending");
      const upComingLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() > new Date().getTime())
      const peoplesOnLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() === new Date().getTime())
      const takenLeave = approvedLeave.filter(data => new Date(data.fromDate).getTime() < new Date().getTime())
      res.send({ leaveData: teamLeaves, pendingLeave, upComingLeave, peoplesOnLeave, takenLeave });
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
      res.status(203).send("Id not found")
    } else {
      res.send(leaveReq);
    }
  } catch (err) {
    res.status(500).send({ message: "Internal server error", details: err.message })
  }
})


// get employee of leave data
leaveApp.get("/date-range/hr", verifyHR, async (req, res) => {
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

    const leaveData = employeesLeaveData.map(data => data.leaveApplication).flat()
    const approvedLeave = leaveData.filter(data => data.status === "approved");
    const leaveInHours = approvedLeave.reduce((total, data) => total + getDayDifference(data) * 9, 0);
    const pendingLeave = leaveData.filter(data => data.status === "pending");
    const upComingLeave = leaveData.filter(data => new Date(data.date).getTime() > new Date().getTime())
    const peoplesOnLeave = approvedLeave.filter(data => new Date(data.date).getTime() === new Date().getTime())
    res.send({ leaveData, approvedLeave, peoplesOnLeave, pendingLeave, upComingLeave, leaveInHours });
  } catch (err) {
    console.log(err);
    
    res.status(500).send({ error: err.message })
  }
})

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

    const leaveData = employeesLeaveData.map(data => data.leaveApplication).flat()
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
      const leaveData = employeeLeaveData.leaveApplication.map(data => data).flat()
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

leaveApp.get("/", verifyAdmin, async (req, res) => {
  try {
    const requests = await LeaveApplication.find().populate({
      path: "employee",
      select: "FirstName LastName"
    });
    if (!requests) {
      res.status(203).send({
        message: "No leave requests in DB"
      })
    } else {
      res.send(requests);
    }
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error", details: err.message })
  }
});

leaveApp.post("/:empId", verifyAdminHREmployee, async (req, res) => {
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
      prescription: req.body.prescription,
      coverBy: req.body.coverBy,
      employee: req.params.empId,
    };

    // Check if there are pending leaves for the same type
    const pendingLeaveData = await LeaveApplication.find({
      leaveType: { $regex: new RegExp("^" + req.body.leaveType, "i") },
      status: "pending",
      employee: req.params.empId,
    });

    if (pendingLeaveData.length > 0) {
      return res.status(400).send({ message: "Please wait for the previous leave response!" });
    }

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
    const empData = await Employee.findById(req.params.empId);
    if (!empData) {
      return res.status(400).send({ message: `No employee found for ID ${req.params.empId}` });
    }

    const relievingOffData = await Employee.findById(req.body.coverBy, "Email FirstName LastName");
    const leaveTypeName = req.body.leaveType.split(" ")[0];
    const leaveDaysCount = empData?.typesOfLeaveRemainingDays[leaveTypeName] || 0;

    if (leaveDaysCount <= takenLeaveCount) {
      return res.status(400).send({ message: `${leaveTypeName} leave limit reached.` });
    }

    // Check if leave request for the same date already exists
    const existingRequest = await LeaveApplication.findOne({
      fromDate: leaveRequest.fromDate,
      employee: req.params.empId,
    });
    if (existingRequest) {
      return res.status(400).send({ message: "Already sent a request on this date." });
    }

    // Validate the leave request
    const { error } = LeaveApplicationValidation.validate(leaveRequest);
    if (error) {
      console.error("Validation Error:", error);
      return res.status(400).send({ message: "Validation Error", details: error.message });
    }

    // Calculate the number of leave days being taken
    let goingToTakeLeave = getDayDifference(req.body);
    if (goingToTakeLeave === 0) goingToTakeLeave = 1;

    // Update employee's leave days and create the leave application
    empData.typesOfLeaveRemainingDays[leaveTypeName] =
      leaveDaysCount - goingToTakeLeave;

    const newLeaveApp = await LeaveApplication.create(leaveRequest);
    empData.leaveApplication.push(newLeaveApp._id);
    await empData.save();

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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.FROM_MAIL,
          pass: process.env.MAILPASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.FROM_MAIL,
        to: relievingOffData.Email,
        subject: "Task Relieving Request",
        html: htmlContent,
      });
    }

    return res.status(201).send({ message: "Leave Request has been sent to Higher Authority." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: err.message });
  }
});


leaveApp.put("/:id", verifyHREmployee, async (req, res) => {
  try {
    const today = new Date();

    // Create start and end of the day for the date comparison
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const isGreaterthanToday = await LeaveApplication.findOne({ _id: req.params.id, fromDate: { $gte: startOfDay } });
    if (isGreaterthanToday) {
      const updatedReq = await LeaveApplication.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.send({ message: `Application has been ${updatedReq.status}` })
    } else {
      res.status(400).send({ error: `Leave request has been expired.` })
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message })
  }
})

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