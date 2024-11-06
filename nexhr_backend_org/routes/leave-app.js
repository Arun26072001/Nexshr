const express = require('express');
const leaveApp = express.Router();
const { LeaveApplication,
  LeaveApplicationValidation
} = require('../models/LeaveAppModel')
const { RoleAndPermission } = require("../models/RoleModel");
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyEmployee, verifyAdmin, verifyAdminHREmployee } = require('../auth/authMiddleware');

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
        path: "role"
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

    const roleIds = await RoleAndPermission.find({ RoleName: requests?.role[0].RoleName }, "_id");
    const collegues = await Employee.find({ role: { $in: roleIds } }, "FirstName LastName Email phone");
    const empIds = await Employee.find({ Account: 3, _id: { $nin: req.params.empId } });
    const peopleOnLeave = await LeaveApplication.find(
      { employee: { $in: empIds }, fromDate: new Date().toISOString().split("T")[0], status: "approved" }
      , "_id fromDate toDate").populate({ path: "employee", select: "_id FirstName LastName" })
    res.send({ requests, collegues, peopleOnLeave });

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
    res.status(500).send({ message: "Error in getting employees leave data", details: err.message })
  }
})

leaveApp.get("/date-range/admin", verifyAdmin, async (req, res) => {
  console.log("call admin");

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
    res.status(500).send({ message: "Error in getting employees leave data", details: err.message })
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
    if (req.body.coverBy === "") {
      req.body.coverBy = null;
    }

    // Construct the leave request object
    let leaveRequest = {
      leaveType: req.body.leaveType.toLowerCase(),
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      periodOfLeave: req.body.periodOfLeave,
      reasonForLeave: req.body.reasonForLeave,
      prescription: req.body.prescription,
      coverBy: req.body.coverBy,
      employee: req.params.empId
    };

    let takenLeaveCount = 0;

    // Fetch approved leave applications for the specific employee
    const leaveData = await LeaveApplication.find({
      leaveType: {
        $regex: new RegExp("^" + req.body.leaveType, "i")
      },
      status: "approved",
      employee: req.params.empId // Check leaves for the specific employee
    });

    // Fetch pending leave applications for the specific employee and leave type
    const pendingLeaveData = await LeaveApplication.find({
      leaveType: {
        $regex: new RegExp("^" + req.body.leaveType, "i")
      },
      status: "pending",
      employee: req.params.empId // Check leaves for the specific employee
    });

    // If there are pending leaves of the same type, return an error
    if (pendingLeaveData.length > 0) {
      return res.status(400).send({ message: "Please wait for Previous Leave Response!" });
    } else {
      // Calculate the total number of leave days already taken
      leaveData.map((data) => {
        const value = getDayDifference(data);
        takenLeaveCount = takenLeaveCount + value;
      });

      // Fetch employee's leave count and remaining leave days
      const empData = await Employee.findById(req.params.empId, "typesOfLeaveCount typesOfLeaveRemainingDays").exec();

      let leaveTypeName = req.body.leaveType.split(" ")[0];
      const leaveDaysCount = empData?.typesOfLeaveRemainingDays[leaveTypeName];

      // Check if the employee has remaining leave days
      if (Number(leaveDaysCount) > takenLeaveCount) {
        // Calculate the number of days for the requested leave
        let GoingToTakeLeave = getDayDifference(req.body);

        // Check if the employee has already submitted a leave request for the same date
        const reqDate = await LeaveApplication.find({ fromDate: leaveRequest.fromDate, employee: req.params.empId });
        if (reqDate.length > 0) {
          return res.status(400).send({ message: "Already sent a request on this date." });
        } else {
          // Validate the leave request
          const { error } = LeaveApplicationValidation.validate(leaveRequest);
          if (error) {
            console.error('Validation Error:', error);
            return res.status(400).send({ message: "Validation Error", details: error.message });
          } else {
            // Fetch employee data
            const empData = await Employee.findById(req.params.empId);
            if (!empData) {
              return res.status(400).send(`No employee found for ID ${req.params.empId}`);
            } else {
              // Create a new leave application
              const newLeaveApp = await LeaveApplication.create(leaveRequest);

              // If leave is 0 days, set it to 1
              if (GoingToTakeLeave === 0) {
                GoingToTakeLeave = 1;
              }

              // Update the employee's remaining leave days
              empData.typesOfLeaveRemainingDays = {
                ...empData.typesOfLeaveRemainingDays,
                [leaveTypeName]: Number(leaveDaysCount) - GoingToTakeLeave
              };

              // Push the leave application ID to the employee's leave applications array
              empData.leaveApplication.push(newLeaveApp._id);

              // Save the updated employee document
              await empData.save();

              return res.status(201).send({ message: "Leave Request has been sent to Higher Authority." });
            }
          }
        }
      } else {
        // If the employee has reached the limit of leave days
        return res.status(400).send({ message: `${leaveTypeName} leave limit reached.` });
      }
    }

  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      message: "Internal Server Error",
      details: err.message
    });
  }
});

leaveApp.put("/:id", verifyHREmployee, async (req, res) => {
  try {
    const updatedReq = await LeaveApplication.findByIdAndUpdate(req.params.id, req.body);
    res.send({ message: `Application has been ${req.body.status}` })
  } catch (err) {
    res.status(500).send({ message: "Internal server error", details: err.message })
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