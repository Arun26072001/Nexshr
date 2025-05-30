const express = require('express');
const router = express.Router();
const { Employee } = require('../models/EmpModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyTeamHigherAuthority, verifyAdminHRTeamHigherAuth } = require('../auth/authMiddleware');
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
    let employees = await Employee.find({}, "FirstName LastName profile Account employmentType dateOfJoining gender working code docType serialNo position department workingTimePattern role")
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
    const { notifications } = await Employee.findById(req.params.id, "notifications profile")
      .populate("notifications.company", "logo CompanyName")
      .exec();

    // const notifications = emp.notifications.filter((item) => item.isViewed === false);
    return res.send(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message })
  }
})

router.put("/notifications/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id, "notifications").exec();
    if (!emp) return res.status(404).send({ error: "Employee not found" });

    const titlesToRemove = req.body.map(n => n.title);

    emp.notifications = emp.notifications.filter(notification =>
      !titlesToRemove.includes(notification.title)
    );

    await emp.save();

    return res.send({ message: "Notifications have been deleted successfully" });
  } catch (error) {
    console.error("Error in updating notifications:", error);
    return res.status(500).send({ error: error.message });
  }
});

router.get("/user", verifyAdminHR, async (req, res) => {
  try {
    const employees = await Employee.find({ Account: 3 }, "_id FirstName LastName profile")
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
    const employees = await Employee.find({}, "_id FirstName LastName profile employmentType dateOfJoining gender working code docType serialNo")
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

    const employees = await Employee.find({}, "FirstName LastName position profile role")
      .populate("position", "PositionName") // Populate only PositionName
      .populate("role", "RoleName")
      .exec();

    // Filter employees based on position name containing the keyword
    const filtered = employees.filter(emp => {
      const positionName = emp?.position?.PositionName;
      const roleName = emp?.role?.RoleName;
      if (["admin", "hr"].includes(higher.toLowerCase())) {
        return roleName && roleName.toLowerCase().includes(higher)
      }
      return positionName && positionName.includes(keyword);
    });
    return res.send(filtered);
  } catch (err) {
    console.log("error in fetch highers", err);

    res.status(500).send({ error: err.message });
  }
});

router.get("/team/members/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    const who = req?.query?.who;
    const teams = await Team.find({ [who]: req.params.id })
      .populate({
        path: "employees",
        select: "FirstName LastName dateOfJoining code profile company employmentType position department workingTimePattern role",
        populate: [
          { path: "company", select: "_id CompanyName Town" },
          { path: "position" },
          { path: "department" },
          { path: "workingTimePattern" },
          { path: "role" }
        ]
      })
      .exec();

    if (!teams.length) {
      return res.status(404).send({ error: "You are not a Team higher authority." })
    }
    const employeesData = teams.map((team) => team.employees).flat();
    const uniqueEmps = [...new Set([...employeesData])]
    return res.send(uniqueEmps);
  } catch (error) {
    console.log(error);
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
          path: "team", populate: [
            { path: "employees", select: "FirstName LastName Email" },
            { path: "lead", select: "FirstName LastName Email" },
            { path: "head", select: "FirstName LastName Email" },
            { path: "manager", select: "FirstName LastName Email" }
          ]
        },
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

// save fcm token for employee
router.post("/add-fcm-token", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const addFcmTokenEmp = await Employee.findByIdAndUpdate(req.body.empId, { $set: { fcmToken: req.body.fcmToken } }, { new: true });
    return res.send({ message: `FCM token has been saved for ${addFcmTokenEmp.FirstName}`, addFcmTokenEmp })
  } catch (error) {
    console.log("erorr in add fcm token", error);
    return res.status(500).send({ error: error.message })
  }
})

router.post("/:id", verifyAdminHR, async (req, res) => {
  try {
    const inviter = await Employee.findById(req.params.id, "FirstName LastName")
      .populate("company", "logo CompanyName");

    const { Email, phone, FirstName, LastName, Password, company, annualLeaveEntitlement, typesOfLeaveCount, employementType } = req.body;

    // Check if email already exists
    if (await Employee.exists({ Email })) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (phone) {
      if (await Employee.exists({ phone })) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    const employeeData = {
      ...req.body,
      role: req.body.role,
      workingTimePattern: req.body.workingTimePattern,
      company: company || inviter.company._id,
      position: null,
      department: null,
      isPermanentWFH: req.body.isPermanentWFH || false,
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
      <a href="${process.env.FRONTEND_BASE_URL}" style="
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
      <p><a href="${process.env.FRONTEND_BASE_URL}" style="color: #28a745;">${process.env.FRONTEND_BASE_URL}</a></p>

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
      return res.status(400).send({ error: err.details });
    }

    if (err.status === 404) {
      return res.status(404).send({ error: err.message });
    }

    res.status(500).send({ error: err.message });
  }
});


router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, Email, Password, hour, mins, profile: newProfile, FirstName, LastName } = req.body;

    // Determine role name and account level
    let accountLevel = 3;
    if (role) {
      const roleData = await RoleAndPermission.findById(role, "RoleName");
      const roleName = roleData?.RoleName?.toLowerCase();
      accountLevel =
        roleName === "admin"
          ? 1
          : roleName === "hr"
            ? 2
            : roleName === "manager"
              ? 4
              : roleName === "network admin"
                ? 5
                : 3;
    }

    // Get employee data with profile and company
    const employeeData = await Employee.findById(id, "profile company Email Password FirstName LastName")
      .populate("company", "logo CompanyName");

    if (!employeeData) return res.status(404).send({ error: "Employee not found" });

    // Delete old profile image if changed
    if (employeeData.profile && employeeData.profile !== newProfile) {
      const oldFile = employeeData.profile.split("/").pop();
      const oldFilePath = path.join(__dirname, "..", "uploads", oldFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Deleted old profile image: ${oldFile}`);
      }
    }

    // Prepare update payload
    const updatedData = {
      ...req.body,
      company: req.body.company || null,
      position: req.body.position || null,
      department: req.body.department || null,
      Account: accountLevel,
    };

    // Set working hours if available
    if (hour && mins) {
      updatedData.companyWorkingHourPerWeek = `${hour}.${mins}`;
    }

    // Check for credentials update
    if (Email !== employeeData.Email || Password !== employeeData.Password) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>${employeeData.company.CompanyName}</title></head>
        <body style="font-family: Arial; background: #f6f9fc; padding: 0; margin: 0;">
          <div style="text-align: center; padding-top: 30px;">
            <img src="${employeeData.company.logo}" alt="Company Logo" style="width: 100px; height: 100px;" />
          </div>
          <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h2>Hi ${FirstName} ${LastName} 👋,</h2>
            <p>Your credentials have been <strong>updated successfully</strong>.</p>
            <p><strong>Email:</strong> ${Email}<br/><strong>Password:</strong> ${Password}</p>
            <a href="${process.env.FRONTEND_BASE_URL}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; border-radius: 30px; text-decoration: none;">Go to Login</a>
            <p>If the button doesn’t work, use this link: <a href="${process.env.FRONTEND_BASE_URL}">${process.env.FRONTEND_BASE_URL}</a></p>
            <p>Thanks,<br/>The ${employeeData.company.CompanyName} Team</p>
          </div>
          <div style="text-align: center; font-size: 13px; color: #777;">
            <p>Need help? <a href="mailto:${process.env.FROM_MAIL}" style="color: #777;">Contact support</a>.</p>
          </div>
        </body>
        </html>
      `;

      await sendMail({
        From: process.env.FROM_MAIL,
        To: employeeData.Email,
        Subject: "Your Credentials are updated",
        HtmlBody: htmlContent,
      });
    }

    // Update employee
    const updatedEmp = await Employee.findByIdAndUpdate(id, updatedData, { new: true });
    res.send({ message: `${updatedEmp.FirstName}'s data has been updated!` });

  } catch (err) {
    console.error("Error in employee update:", err);
    res.status(500).send({ error: err.message });
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