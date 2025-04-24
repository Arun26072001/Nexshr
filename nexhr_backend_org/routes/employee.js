const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyAdmin, verifyTeamHigherAuthority, verifyAdminHRTeamHigherAuth, verifyAdminHREmployee } = require('../auth/authMiddleware');
const { getDayDifference } = require('./leave-app');
const sendMail = require("./mailSender");
const { RoleAndPermission } = require('../models/RoleModel');
const { Team } = require('../models/TeamModel');
const fs = require("fs");
const path = require("path");
const { LeaveApplication } = require('../models/LeaveAppModel');

router.get("/", verifyAdminHRTeamHigherAuth, async (req, res) => {
  try {
    const { onlyEmps } = req.query;

    let employees = await Employee.find({}, "FirstName LastName Account employmentType dateOfJoining gender working code docType serialNo position department workingTimePattern role")
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
      .lean();
    if (onlyEmps) {
      employees = employees.filter((emp) => !["Team Lead", "Team Head", "Manager"].includes(emp?.position?.PositionName) && emp.Account !== 1)
    }
    res.send(employees)
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message })
  }
});

router.get("/notifications/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id, "notifications")
      .populate("notifications.company", "logo CompanyName")
      .exec();

    const notifications = emp.notifications.filter((item) => item.isViewed === false);
    return res.send(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message })
  }
})

router.put("/notifications/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id, "notifications").exec();
    const updatedNotifications = emp.notifications.map((item) => {
      const match = req.body.find((data) => data.title === item.title);
      return match ? match : item
    })

    const updatedEmpWithNotifications = {
      ...emp.toObject(),
      notifications: updatedNotifications
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, updatedEmpWithNotifications, { new: true })
    return res.send({ message: "Notifications has been updated successfully", updated })
  } catch (error) {
    console.log("error in update notifications", error);
    return res.status(500).send({ error: error.message })
  }
})

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
        },
        // {
        //   path: 'teamLead',
        //   select: "_id FirstName LastName",
        //   populate: {
        //     path: "department"
        //   }
        // }
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
    // .populate({
    //   path: 'teamLead',
    //   select: "_id FirstName LastName",
    //   populate: {
    //     path: "department"
    //   }
    // })

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
        // {
        //   path: "leaveApplication",
        //   match: { leaveType: { $ne: "Permission Leave" }, fromDate: { $gte: startDate }, toDate: { $lte: endDate } }
        // },
        { path: "team", populate: { path: "employees", select: "FirstName LastName Email" } },
        { path: "workingTimePattern" },
        { path: "department" },
        { path: "position" }
      ])
      .exec();

    if (!emp) {
      return res.status(404).send({ error: "Employee not found!" });
    }
    const leaveApplications = await LeaveApplication.find({
      employee: req.params.id,
      fromDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    // Filter leave requests
    const pendingLeaveRequests = leaveApplications.filter((leave) => leave.status === "pending");
    const takenLeaveRequests = leaveApplications.filter((leave) => leave.status === "approved" && !leave.leaveType.toLowerCase().includes("unpaid"));
    const unpaidLeaveRequest = leaveApplications.filter((leave) => leave.leaveType.toLowerCase().includes("unpaid"))

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

router.post("/:id", verifyAdminHR, async (req, res) => {
  try {
    const inviter = await Employee.findById(req.params.id, "FirstName LastName")
      .populate("company", "logo CompanyName");

    const { Email, phone, FirstName, LastName, Password, company, annualLeaveEntitlement, typesOfLeaveCount, employementType } = req.body;

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
      // teamLead: teamLead,
      // managerId: managerId,
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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${inviter.company.CompanyName}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
  <div style="text-align: center; padding-top: 30px;">
    <img src="${inviter.company.logo}" alt="Company Logo" style="width: 100px; height: 100px; object-fit: cover; margin-bottom: 10px;" />
  </div>
  <div style="display: flex; justify-content: center; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: left;">
      <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 10px;">Hi ${FirstName} ${LastName} 👋,</h2>
      <div style="border-bottom: 3px solid #28a745; width: 30px; margin-bottom: 20px;"></div>
      <p style="font-size: 15px; margin-bottom: 10px;">Welcome to <strong>${inviter.company.CompanyName}</strong>! We're excited to have you on board.</p>
      
      <p style="font-size: 15px; margin: 20px 0 10px;"><strong>Your credentials:</strong></p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${Email}</p>
      <p style="margin: 5px 0;"><strong>Password:</strong> ${Password}</p>

      <p style="margin-top: 20px;">Please click the button below to confirm your email and get started:</p>
      <a href="${process.env.FRONTEND_URL}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #28a745;
        color: white;
        border-radius: 30px;
        text-decoration: none;
        font-weight: bold;
        margin: 15px 0;
      ">Confirm Email</a>

      <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
      <p><a href="${process.env.FRONTEND_URL}" style="color: #28a745;">${process.env.FRONTEND_URL}</a></p>

      <p style="margin-top: 30px;">Cheers,<br/>The ${inviter.company.CompanyName} Team</p>
    </div>
  </div>

  <div style="text-align: center; font-size: 13px; color: #777; margin-top: 20px; padding-bottom: 20px;">
    <p>Have questions? <a href="mailto:support@${inviter.company.CompanyName.toLowerCase()}.com" style="color: #777;">Contact our support team</a>.</p>
  </div>
</body>
</html>
`;


    sendMail({
      From: process.env.FROM_MAIL,
      To: Email,
      Subject: `Welcome to ${inviter.company.CompanyName}`,
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
    // check previous profile and current are same
    const empData = await Employee.findById(req.params.id, "profile company").populate("company", "logo CompanyName");

    if (empData?.profile && empData.profile !== req.body.profile) {
      const filename = empData.profile.split("/").pop();
      const filePath = path.join(__dirname, "..", "uploads", filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old profile image: ${filename}`);
        }
      } catch (error) {
        console.error("Error deleting profile image:", error.message);
      }
    }
    let newEmployee = {
      ...req.body,
      company: req?.body?.company || null,
      position: req?.body?.position || null,
      department: req?.body?.department || null,
      // teamLead: req?.body?.teamLead || "665601de20a3c61c646a135f",
      // managerId: req?.body?.managerId || "6651e4a810994f1d24cf3a19",
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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${empData.company.CompanyName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
        <div style="text-align: center; padding-top: 30px;">
          <img src="${empData.company.logo}" alt="Company Logo" style="width: 100px; height: 100px; object-fit: cover; margin-bottom: 10px;" />
        </div>
        <div style="display: flex; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 30px;max-width:600px; margin: 0px auto; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: left;">
            <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 10px;">Hi ${FirstName} ${LastName} 👋,</h2>
            <div style="border-bottom: 3px solid #28a745; width: 30px; margin-bottom: 20px;"></div>
            <p style="font-size: 15px; margin-bottom: 10px;">Your credentials have been <strong>updated successfully</strong>.</p>
      
            <p style="font-size: 15px; margin: 20px 0 10px;"><strong>New credentials:</strong></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${req.body.Email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${req.body.Password}</p>
      
            <p style="margin-top: 20px;">Please use these updated credentials from now on to log in to your account.</p>
      
            <a href="${process.env.FRONTEND_URL}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #4CAF50;
              color: white;
              border-radius: 30px;
              text-decoration: none;
              font-weight: bold;
              margin: 20px 0;
            ">Go to Login</a>
      
            <p>If the button doesn’t work, you can copy and paste this link into your browser:</p>
            <p><a href="${process.env.FRONTEND_URL}" style="color: #28a745;">${process.env.FRONTEND_URL}</a></p>
      
            <p style="margin-top: 30px;">Thanks,<br/>The ${empData.company.CompanyName} Team</p>
          </div>
        </div>
      
        <div style="text-align: center; font-size: 13px; color: #777; margin-top: 20px; padding-bottom: 20px;">
          <p>Need help? <a href="mailto:${process.env.FROM_MAIL}" style="color: #777;">Contact support</a>.</p>
        </div>
      </body>
      </html>
      `;


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

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const deletEmp = await Employee.findByIdAndRemove(req.params.id);
    return res.status(200).send({ message: `${deletEmp.FirstName + " " + deletEmp.LastName} deleted successfully` })
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message })
  }
});

// module.getEmployeeModel = getEmployeeModel;
module.exports = router;