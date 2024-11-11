const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyAdminHREmployee, verifyAdminHR } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');
const { PaySlipInfo } = require('../models/PaySlipInfoModel');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAILPASSWORD
  }
})

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
    const employees = await Employee.find({}, "_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
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
      .populate({ path: "role" })
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
    res.status(500).send({ details: err.message });
  }
});


router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const { Email, phone, basicSalary, FirstName, LastName, Password } = req.body;

    // Check if email or phone number already exists
    const emailExists = await Employee.exists({ Email });
    // const phoneExists = await Employee.exists({ phone });

    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // if (phoneExists) {
    //   return res.status(400).json({ message: "Phone number already exists" });
    // }

    // Fetch payslip data
    const payslipData = await PaySlipInfo.findOne().exec();
    if (!payslipData) {
      return res.status(400).json({ message: "Payslip data not found" });
    }

    // Initialize object to hold calculated values
    const payslipFields = {};

    // Calculate values based on payslip fields
    payslipData.payslipFields.forEach((data) => {
      const basicSalaryNumber = Number(basicSalary);
      let calculatedValue = 0;

      switch (data.fieldName) {
        case "incomeTax":
          if (basicSalaryNumber >= 84000) {
            calculatedValue = (30 / 100) * basicSalaryNumber; // 30% tax for >= 84,000
          } else if (basicSalaryNumber > 42000) {
            calculatedValue = (20 / 100) * basicSalaryNumber; // 20% tax for > 42,000
          } else if (basicSalaryNumber >= 25000) {
            calculatedValue = (5 / 100) * basicSalaryNumber;  // 5% tax for 25,001 to 42,000
          }
          break;
        case "houseRentAllowance":
        case "conveyanceAllowance":
        case "othersAllowance":
        case "bonusAllowance":
          calculatedValue = (data.value / 100) * basicSalaryNumber;
          break;
        case "ProvidentFund":
          if (basicSalaryNumber > 15000) {
            calculatedValue = (12 / 100) * basicSalaryNumber;
          }
          break;
        case "Professional Tax":
          if (basicSalaryNumber > 21000) {
            calculatedValue = 130;
          }
          break;
        case "ESI":
          if (basicSalaryNumber > 21000) {
            calculatedValue = (0.75 / 100) * basicSalaryNumber;
          }
          break;
        default:
          calculatedValue = 0;
      }

      // Store calculated value for the field
      payslipFields[data.fieldName] = calculatedValue;
    });

    // Prepare employee data with calculated payslip fields
    // updated for testing
    const employeeData = {
      ...req.body,
      teamLead: req.body.teamLead || ["665601de20a3c61c646a135f"],
      managerId: req.body.managerId || ["6651e4a810994f1d24cf3a19"],
      company: req.body.company || ["6651a5eb6115df44c0cc7151"],
      annualLeaveEntitlement: req.body.annualLeaveEntitlement || 21,
      accountNo: "9038948932",
      IFSCcode: "SBI920210",
      payslipFields,
    };
    // Save the employee data
    const employee = await Employee.create(employeeData);

    // Define the email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NexsHR</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f6f9fc;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px;
          }
          .header img {
            max-width: 100px;
          }
          .content {
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #28a745;
            color: #fff !important;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            margin-top: 20px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Logo" />
            <h1>Welcome to NexsHR</h1>
          </div>
          <div class="content">
            <p>Hey ${FirstName} ${LastName} 👋,</p>
            <p><b>Your credentials</b></p><br />
            <p><b>Email</b> ${Email}</p><br />
             <p><b>Password</b> ${Password}</p><br />
            <p>Thank you for registering! Please confirm your email by clicking the button below.</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Confirm Email</a>
          </div>
          <div class="footer">
            <p>Have questions? Need help? <a href="mailto:webnexs29@gmail.com">Contact our support team</a>.</p>
          </div>
        </div>
      </body>
      </html>`;

    // Send an email to the employee for verification
    const mailOptions = {
      from: process.env.EMAIL,
      to: Email,
      subject: "Welcome to NexsHR",
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      console.log(mailOptions);
      
      if (err) {
        console.error("Email error:", err.message);
      } else {
        console.log(`Email sent to ${Email}. ${info.response}`);
      }
    });

    // Return success response
    res.status(201).json({ message: "Employee details saved successfully!", employee });
  } catch (err) {
    console.error("Error:", err);

    if (err.isJoi) {
      return res.status(400).json({ error: "Validation Error", message: err.details });
    }

    if (err.status === 404) {
      return res.status(404).json({ error: "Not Found", message: err.message });
    }

    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});


router.put("/:id", verifyHR, async (req, res) => {
  try {
    let newEmployee = req.body;
    console.log(newEmployee);

    if (req.body.hour && req.body.mins) {
      newEmployee = {
        ...req.body,
        ['companyWorkingHourPerWeek']: `${req.body.hour}.${req.body.mins}`
      };
    }
    const updatedEmp = await Employee.findByIdAndUpdate(req.params.id, newEmployee)
    res.send({ message: "Employee data has been updated!" });
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

module.exports = router;