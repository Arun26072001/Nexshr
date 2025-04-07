const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyHR, verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdmin, verifyTeamHigherAuthority, verifyAdminHRTeamHigherAuth, verifyAdminHREmployee } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');
const sendMail = require("./mailSender");
const { RoleAndPermission } = require('../models/RoleModel');
const { Team } = require('../models/TeamModel');

router.get("/", verifyAdminHRTeamHigherAuth, async (req, res) => {
  try {
    const { onlyEmps } = req.query;

    let employees = await Employee.find({ Account: 3 }, "_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
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
      }).lean();
    if (onlyEmps) {
      employees = employees.filter((emp) => !["Team Lead", "Team Head", "Manager"].includes(emp?.position?.PositionName))
    }
    res.send(employees)
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message })
  }
});

router.get("/user", verifyAdminHR, async (req, res) => {
  try {
    const employees = await Employee.find({ Account: 3 }, "_id FirstName LastName")
      .populate({
        path: "department",
        select: "DepartmentName",
      }).lean();
    const departmentMap = {};

    employees?.forEach((employee) => {
      const departmentName = employee?.department?.DepartmentName;

      if (!departmentMap[departmentName]) {
        departmentMap[departmentName] = [];
      }

      departmentMap[departmentName].push({
        label: `${employee.FirstName} ${employee.LastName}`,
        name: employee.FirstName.toLowerCase(),
        value: employee._id,
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
    res.status(500).send({ error: err.message });
  }
});


router.get("/all", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const employees = await Employee.find({}, "_id FirstName LastName employmentType dateOfJoining gender working code docType serialNo")
      .populate([
        {
          path: "company",
          select: "_id CompanyName Town"
        }, {
          path: "position"
        },
        {
          path: "department"
        }, {
          path: "workingTimePattern",
        }, {
          path: "role"
        }, {
          path: 'teamLead',
          select: "_id FirstName LastName",
          populate: {
            path: "department"
          }
        }
      ]).lean().exec();
    res.send(employees)
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message })
  }
});

router.get("/team/:higher", verifyAdminHRTeamHigherAuth, async (req, res) => {
  try {
    const { higher } = req.params;

    // Determine the keyword to filter by
    let keyword;
    if (higher === "lead") keyword = "Lead";
    else if (higher === "head") keyword = "Head";
    else keyword = "Manager";

    const employees = await Employee.find({}, "FirstName LastName position")
      .populate("position", "PositionName") // Populate only PositionName
      .exec();

    // Filter employees based on position name containing the keyword
    const filtered = employees.filter(emp => {
      const positionName = emp?.position?.PositionName;
      return positionName && positionName.includes(keyword);
    });

    res.send(filtered);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


router.get("/team/members/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    const who = req?.query?.who;
    const team = await Team.findOne({ [who]: req.params.id }).exec();
    if (!team) {
      return res.status(404).send({ error: "You are not a Team higher authority." })
    }
    const members = await Employee.find({ _id: { $in: team.employees } })
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

    return res.send(members);
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.get('/:id', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  let totalTakenLeaveCount = 0;
  let totalUnpaidLeaveCount = 0;
  const empData = await Employee.findById(req.params.id, "annualLeaveYearStart")
  const now = new Date();
  const annualStart = empData?.annualLeaveYearStart ? new Date(empData?.annualLeaveYearStart) : new Date(now.setDate(1));
  startDate = new Date(now.getFullYear(), annualStart.getMonth(), annualStart.getDate());
  endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1, 23, 59, 59, 999);

  try {
    const emp = await Employee.findById(req.params.id, "-clockIns -payslip")
      .populate([
        { path: "role" },
        {
          path: "leaveApplication",
          match: { leaveType: { $ne: "Permission Leave" }, fromDate: { $gte: startDate }, toDate: { $lte: endDate } }
        },
        { path: "team", populate: { path: "employees", select: "FirstName LastName Email" } },
        { path: "workingTimePattern" },
        { path: "department" },
        { path: "position" }
      ])
      .exec();

    if (!emp) {
      return res.status(404).send({ error: "Employee not found!" });
    }
    // Filter leave requests
    const pendingLeaveRequests = emp.leaveApplication.filter((leave) => leave.status === "pending");
    const takenLeaveRequests = emp.leaveApplication.filter((leave) => leave.status === "approved" && leave.leaveType !== "Unpaid Leave (LWP)");
    const unpaidLeaveRequest = emp.leaveApplication.filter((leave) => leave.leaveType.includes("Unpaid Leave"))

    // Calculate total taken leave count
    takenLeaveRequests.forEach((leave) => totalTakenLeaveCount += Math.ceil(getDayDifference(leave)));
    unpaidLeaveRequest.forEach((leave) => totalUnpaidLeaveCount += Math.ceil(getDayDifference(leave)))

    // Send response with employee details, pending leave requests, taken leave count, and colleagues
    res.send({
      ...emp.toObject(), // Ensure that you return a plain object, not a Mongoose document
      pendingLeaveRequests: pendingLeaveRequests?.length,
      totalTakenLeaveCount: Number(totalTakenLeaveCount?.toFixed(2)),
      totalUnpaidLeaveCount,
      collegues: emp.team ? emp.team.employees : []
    });

  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message });
  }
});

router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const { Email, phone, FirstName, LastName, Password, teamLead, managerId, company, annualLeaveEntitlement, typesOfLeaveCount, employementType } = req.body;

    // Check if email already exists
    if (await Employee.exists({ Email })) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (await Employee.exists({ phone })) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const employeeData = {
      ...req.body,
      role: req.body.role || "679b31dba453436edb1b27a3",
      teamLead: teamLead,
      managerId: managerId,
      workingTimePattern: req.body.workingTimePattern || "679ca37c9ac5c938538f18ba",
      company: company || "679b5ee55eb2dc34115be175",
      position: null,
      department: null,
      annualLeaveEntitlement: annualLeaveEntitlement || 14,
      employementType: employementType || "Full-time",
      typesOfLeaveCount: { ...typesOfLeaveCount, Permission: 2 },
      typesOfLeaveRemainingDays: typesOfLeaveCount
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
          .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
          .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; }
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
            <p>Have questions? Need help? <a href="mailto:${process.env.FRONTEND_URL}">Contact our support team</a>.</p>
          </div>
        </div>
      </body>
      </html>`;

    sendMail({
      From: process.env.FROM_MAIL,
      To: Email,
      Subject: "Welcome to NexsHR",
      HtmlBody: htmlContent,
    });

    res.status(201).json({ message: "Employee details saved successfully!", employee });
  } catch (err) {
    console.error("Error:", err);

    if (err.isJoi) {
      return res.status(400).json({ error: err.details });
    }

    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    let roleName;
    if (req?.body?.role) {
      const roleData = await RoleAndPermission.findById(req.body.role, "RoleName")
      roleName = roleData.RoleName;
    }
    let newEmployee = {
      ...req.body,
      company: req?.body?.company || null,
      position: req?.body?.position || null,
      department: req?.body?.department || null,
      teamLead: req?.body?.teamLead || "665601de20a3c61c646a135f",
      managerId: req?.body?.managerId || "6651e4a810994f1d24cf3a19",
      Account: roleName === "Admin" ? 1 : roleName === "HR" ? 2 : roleName?.toLowerCase() === "manager" ? 4 : roleName.toLowerCase() === "network admin" ? 5 : 3
    };

    if (req.body.hour && req.body.mins) {
      newEmployee = {
        ...req.body,
        ['companyWorkingHourPerWeek']: `${req.body.hour}.${req.body.mins}`
      };
    }
    const { Email, Password } = await Employee.findById(req.params.id, "Email Password").exec();
    if (Email !== req.body.Email || Password !== req.body.Password) {
      // send mail for update their credentials

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
          .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; }
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
            <p><b>Your Updated credentials</b></p><br />
            <p><b>Email</b>: ${req.body.Email}</p>
            <p><b>Password</b>: ${req.body.Password}</p><br />
            <p>Your details has been Updated, Hereafter please use these credentials for login.</p>
            <p>Thank you.</p>
          </div>
          <div class="footer">
            <p>Have questions? Need help? <a href="mailto:${process.env.FROM_MAIL}">Contact our support team</a>.</p>
          </div>
        </div>
      </body>
      </html>`;

      sendMail({
        From: process.env.FROM_MAIL,
        To: Email,
        Subject: "Your Credentials are updated",
        HtmlBody: htmlContent,
      });

    }
    const updatedEmp = await Employee.findByIdAndUpdate({ _id: req.params.id }, newEmployee, { new: true })
    res.send({ message: `${updatedEmp.FirstName} data has been updated!` });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message })
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

// module.getEmployeeModel = getEmployeeModel;
module.exports = router;