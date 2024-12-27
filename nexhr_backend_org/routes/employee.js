const express = require('express');
const router = express.Router();
const { Employee, employeeSchema } = require('../models/EmpModel');
const { verifyHR, verifyAdminHREmployee, verifyAdminHR } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');
const { PaySlipInfo } = require('../models/PaySlipInfoModel');
const nodemailer = require("nodemailer");
const { getPayslipInfoModel } = require('./payslipInfo');

router.get("/", verifyAdminHR, async (req, res) => {
  try {
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Employee = getEmployeeModel(orgName)
    const employees = await Employee.find({ Account: 3 }, "_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
      // .populate({
      //   path: "orgId"
      // })
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
    res.status(500).send({ message: err.message })
  }

});

router.get("/user", verifyAdminHR, async (req, res) => {
  try {
    const employees = await Employee.find({ Account: 3 }, "_id FirstName LastName")
      .populate({
        path: "department",
        select: "DepartmentName",
      });


    const departmentMap = {};

    employees.forEach((employee) => {
      employee.department.forEach((dept) => {
        const departmentName = dept.DepartmentName;

        if (!departmentMap[departmentName]) {
          departmentMap[departmentName] = [];
        }

        departmentMap[departmentName].push({
          label: `${employee.FirstName} ${employee.LastName}`,
          value: employee.FirstName.toLowerCase(),
          id: employee._id.toString(),
        });
      });
    });


    const teamData = Object.keys(departmentMap).map((departmentName) => ({
      label: departmentName,
      value: departmentName,
      children: departmentMap[departmentName],
    }));

    const selectAllOption = {
      label: "Select All",
      value: "select-all",
      children: teamData,
    };


    const formattedTeams = [selectAllOption];

    res.status(200).json({
      status: true,
      status_code: 200,
      Team: formattedTeams,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error", details: err.message });
  }
});


router.get("/all", verifyAdminHREmployee, async (req, res) => {
  try {
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Employee = getEmployeeModel(orgName)
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
    res.status(500).send({ error: err.message })
  }

});

router.get("/lead", verifyAdminHR, async (req, res) => {
  try {
    const teamLeads = await Employee.find({}, "FirstName LastName").populate("position").exec();
    const filterTeamLeads = teamLeads.filter((lead) => lead.position[0].PositionName === "TL");
    res.send(filterTeamLeads);
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

router.get("/head", verifyAdminHR, async (req, res) => {
  try {
    const positions = await Employee.find({}, "FirstName LastName").populate("position").exec();
    const filterTeamHeads = positions.filter((head) => head.position[0].PositionName === "Team Head");
    res.send(filterTeamHeads);
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

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
    console.log(takenLeaveRequests);

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
    const { Email, phone, basicSalary, FirstName, LastName, Password, teamLead, managerId, company, annualLeaveEntitlement } = req.body;

    // const {orgName, orgId} = jwt.decode(req.headers['authorization']);
    // const Employee = getEmployeeModel(orgName)

    // Check if email already exists
    if (await Employee.exists({ Email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // const OrgPayslipInfoModel = getPayslipInfoModel(orgName);
    // const payslipData = await OrgPayslipInfoModel.findOne().exec();
    const payslipData = await PaySlipInfo.findOne().exec();
    if (!payslipData) {
      return res.status(400).json({ message: "Payslip data not found" });
    }
    
    const payslipFields = {};
    const basicSalaryNumber = Number(basicSalary);

    payslipData.payslipFields.forEach((data) => {
      let calculatedValue = 0;

      switch (data.fieldName) {
        case "incomeTax":
          if (basicSalaryNumber >= 84000) calculatedValue = (30 / 100) * basicSalaryNumber;
          else if (basicSalaryNumber > 42000) calculatedValue = (20 / 100) * basicSalaryNumber;
          else if (basicSalaryNumber >= 25000) calculatedValue = (5 / 100) * basicSalaryNumber;
          break;
        case "houseRentAllowance":
        case "conveyanceAllowance":
        case "othersAllowance":
        case "bonusAllowance":
          calculatedValue = (data.value / 100) * basicSalaryNumber;
          break;
        case "ProvidentFund":
          if (basicSalaryNumber > 15000) calculatedValue = (12 / 100) * basicSalaryNumber;
          break;
        case "Professional Tax":
          if (basicSalaryNumber > 21000) calculatedValue = 130;
          break;
        case "ESI":
          if (basicSalaryNumber > 21000) calculatedValue = (0.75 / 100) * basicSalaryNumber;
          break;
        default:
          calculatedValue = 0;
      }
      payslipFields[data.fieldName] = calculatedValue;
    });

    const employeeData = {
      ...req.body,
      Email: req.body.Email.toLowerCase(),
      teamLead: teamLead || ["665601de20a3c61c646a135f"],
      managerId: managerId || ["6651e4a810994f1d24cf3a19"],
      company: company || ["6651a5eb6115df44c0cc7151"],
      annualLeaveEntitlement: annualLeaveEntitlement || 14,
      payslipFields,
    };

    const employee = await Employee.create(employeeData);

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
          .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
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
            <p><b>Email</b>: ${Email}</p><br />
            <p><b>Password</b>: ${Password}</p><br />
            <p>Your details has been register! Please confirm your email by clicking the button below.</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Confirm Email</a>
          </div>
          <div class="footer">
            <p>Have questions? Need help? <a href="mailto:webnexs29@gmail.com">Contact our support team</a>.</p>
          </div>
        </div>
      </body>
      </html>`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.FROM_MAIL,
        pass: process.env.MAILPASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_MAIL,
      to: Email,
      subject: "Welcome to NexsHR",
      html: htmlContent,
    });

    res.status(201).json({ message: "Employee details saved successfully!", employee });
  } catch (err) {
    console.error("Error:", err);

    if (err.isJoi) {
      return res.status(400).json({ error: "Validation Error", message: err.details });
    }

    if (err.status === 404) {
      return res.status(404).json({ error: "Not Found", message: err.message });
    }

    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    let newEmployee = req.body;

    if (req.body.hour && req.body.mins) {
      newEmployee = {
        ...req.body,
        ['companyWorkingHourPerWeek']: `${req.body.hour}.${req.body.mins}`
      };
    }
    // const {orgName} = jwt.decode(req.headers['authorization']);
    // const Employee = getEmployeeModel(orgName)
    const updatedEmp = await Employee.findByIdAndUpdate(req.params.id, newEmployee, { new: true })
    res.send({ message: `${updatedEmp.FirstName} data has been updated!` });
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
});

router.delete("/:id", verifyHR, (req, res) => {
  // const {orgName} = jwt.decode(req.headers['authorization']);
  // const Employee = getEmployeeModel(orgName)
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

// module.getEmployeeModel = getEmployeeModel;
module.exports = router;