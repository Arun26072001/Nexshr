const express = require('express');
const router = express.Router();
const { Employee, EmployeeValidation } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyAdminHREmployee, verifyAdminHR } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');

router.get("/", verifyAdminHR, async (req, res) => {
  try {
    const employees = await Employee.find({ Account: 3 }, "_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
      .populate({
        path: "company",
        select: "_id CompanyName Town"
      })
      .populate({
        path: "position"
      })
      .populate({
        path: "department"
      })
      .populate({
        path: "workingTimePattern",
      })
      .populate({
        path: "role"
      })
    res.send(employees)
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal server error", details: err.details })
  }

});

router.get('/:id', verifyAdminHREmployee, async (req, res) => {
  let totalTakenLeaveCount = 0;

  try {
    const emp = await Employee.findById(req.params.id)
      .populate("role")
      .populate("leaveApplication")
      .populate("workingTimePattern")
      .exec();

    if (!emp) {
      return res.status(404).send({ message: "Employee not found!" });
    }

    // Filter leave requests
    const pendingLeaveRequests = emp.leaveApplication.filter((leave) => leave.status === "pending");
    const takenLeaveRequests = emp.leaveApplication.filter((leave) => leave.status === "approved");

    // Calculate total taken leave count
    takenLeaveRequests.forEach((leave) => totalTakenLeaveCount += getDayDifference(leave));

    // Find colleagues with the same role
    const collegues = await Employee.find({}, "FirstName LastName")
      .populate({
        path: "role",
        match: { RoleName: emp.role[0].RoleName }, // Accessing the first role in the array
        select: "RoleName"
      }).exec();

    if (!collegues || collegues.length === 0) {
      return res.status(404).send({ message: "No colleagues found with the same role!" });
    }

    // Send response with employee details, pending leave requests, taken leave count, and colleagues
    res.send({
      ...emp.toObject(), // Ensure that you return a plain object, not a Mongoose document
      pendingLeaveRequests: pendingLeaveRequests?.length,
      totalTakenLeaveCount,
      collegues
    });

  } catch (err) {
    res.status(500).send({ message: "Internal server error", details: err.message });
  }
});


// router.get('/searchName/:name', verifyHR, (req, res) => {
//   const searchTerm = req.params.name.trim(); // Trim any leading/trailing whitespace

//   // Construct a regex pattern for case-insensitive search
//   const regexPattern = new RegExp(searchTerm, 'i');

//   Employee.find({ FirstName: { $regex: regexPattern } })
//     .populate('company')
//     .populate('position')
//     .exec((err, employees) => {
//       if (err) {
//         return res.status(500).send(err); // Return a 500 status for server errors
//       }
//       if (employees.length === 0) {
//         return res.status(204).send({ message: "Employee not found" }); // Return a 404 status if no employees match the criteria
//       }
//       return res.send(employees);
//     });
// });

router.post("/", verifyHR, async (req, res) => {
  try {
    const emailId = await Employee.find({ Email: req.body.Email });
    const phoneNo = await Employee.find({ phone: req.body.phone });
    if (emailId.length > 0) {
      res.status(400).send({ message: "Email is already Exist" })
    } else if (phoneNo.length > 0) {
      res.status(400).send({ message: "Phone is already Exist" })
    } else {
      const emp = await Employee.create(req.body);
      res.status(201).send({ message: "Employee Details Saved Successfully!" });
    }
  } catch (err) {
    console.error("Error:", err);  // Log the error for debugging

    if (err.isJoi) {
      res.status(400).send({ error: "Validation Error", message: err.details });
    } else if (err.status === 404) {
      res.status(404).send({ error: "Not Found", message: err.message });
    } else if (err.status === 500) {
      res.status(500).send({ error: "Internal Server Error", message: "An internal server error occurred." });
    } else {
      // General error handling
      res.status(500).send({ error: "Unknown Error", message: err.message || "An unknown error occurred." });
    }
  }
});


router.put("/:id", verifyHR, async (req, res) => {
  try {
    let newEmployee = req.body;
    if (req.body.hour && req.body.mins) {
      newEmployee = {
        ...req.body,
        ['companyWorkingHourPerWeek']: `${req.body.hour}.${req.body.mins}`
      };
    }
    const updatedEmp = await Employee.findByIdAndUpdate(req.params.id, newEmployee)
    res.send(updatedEmp);
  } catch (err) {
    res.status(500).send(err)
  }
});



router.delete("/:id", verifyHR, (req, res) => {
  Employee.findByIdAndRemove({ _id: req.params.id }, function (err, employee) {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.send({
        message: "Employee deleted"
      })
    }
  });
});

module.exports = router;