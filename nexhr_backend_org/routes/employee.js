const express = require('express');
const router = express.Router();
const { Employee, EmployeeValidation } = require('../models/EmpModel');
const { verifyHR, verifyHREmployee, verifyAdminHREmployee, verifyAdminHR } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');
const { PaySlipInfo } = require('../models/PaySlipInfoModel');

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
      .populate({
        path: 'teamLead',
        select: "_id FirstName LastName",
        populate: {
            path: "department"
        }
    })
    res.send(employees)
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal server error", details: err.details })
  }

});

router.get("/all", verifyAdminHR, async (req, res) => {
  try {
    const employees = await Employee.find({},"_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
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
      .populate({
        path: 'teamLead',
        select: "_id FirstName LastName",
        populate: {
            path: "department"
        }
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
    // Check if email or phone number already exists
    const emailExists = await Employee.exists({ Email: req.body.Email });
    const phoneExists = await Employee.exists({ phone: req.body.phone });

    if (emailExists) {
      return res.status(400).send({ message: "Email already exists" });
    }

    if (phoneExists) {
      return res.status(400).send({ message: "Phone number already exists" });
    }

    // Fetch payslip data
    const payslipData = await PaySlipInfo.findOne().exec();

    if (!payslipData) {
      return res.status(400).send({ message: "Payslip data not found" });
    }

    // Initialize object to hold calculated values
    let payslipFields = {};

    // Calculate values based on payslip fields
    payslipData.payslipFields.forEach((data) => {
      let calculatedValue = 0;
      const basicSalary = Number(req.body.basicSalary);

      switch (data.fieldName) {
        case "incomeTax":
          if (basicSalary >= 84000) {
            calculatedValue = (30 / 100) * basicSalary; // 30% tax for >= 84,000
          } else if (basicSalary > 42000) {
            calculatedValue = (20 / 100) * basicSalary; // 20% tax for > 42,000
          } else if (basicSalary >= 25000) {
            calculatedValue = (5 / 100) * basicSalary;  // 5% tax for 25,001 to 42,000
          }
          break;
        case "houseRentAllowance":
        case "conveyanceAllowance":
        case "othersAllowance":
        case "bonusAllowance":
          calculatedValue = (data.value / 100) * basicSalary;  // Percent of basic salary
          break;
        case "ProvidentFund":
          if (basicSalary > 15000) {
            calculatedValue = (12 / 100) * basicSalary;  // 12% of basic salary
          }
          break;
        case "Professional Tax":
          if (basicSalary > 21000) {
            calculatedValue = 130;  // Fixed professional tax amount
          }
          break;
        case "ESI":
          if (basicSalary > 21000) {
            calculatedValue = (0.75 / 100) * basicSalary;  // 0.75% of basic salary
          }
          break;
        default:
          calculatedValue = 0;  // Default value for unhandled fields
      }

      // Store calculated value for the field
      payslipFields[data.fieldName] = calculatedValue;
    });

    // Create employee with the request body and calculated fields
    const employeeData = {
      ...req.body,
      payslipFields
    };

    // Save the employee data
    const employee = await Employee.create(employeeData);

    // Return success response
    res.status(201).send({ message: "Employee Details Saved Successfully!", employee });
  } catch (err) {
    console.error("Error:", err);  // Log the error for debugging

    if (err.isJoi) {
      return res.status(400).send({ error: "Validation Error", message: err.details });
    }

    // Handle known error statuses
    if (err.status === 404) {
      return res.status(404).send({ error: "Not Found", message: err.message });
    }

    // Default internal server error
    return res.status(500).send({ error: "Internal Server Error", message: "An internal server error occurred." });
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