const express = require('express');
const router = express.Router();
const { TimePattern, TimePatternValidation } = require('../models/TimePatternModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { changeClientTimezoneDate, errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');
const { pushNotification, sendMail } = require('../Reuseable_functions/notifyFunction');

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);

    if (!companyId) {
      return res.status(400).send({
        error: "You are not part of any company. Please check with your higher authorities."
      });
    }

    const pattern = await TimePattern.find({ isDeleted: false, company: companyId });

    return res.send(pattern);
  } catch (error) {
    console.error("Error fetching time patterns:", error);
    return res.status(500).send({ message: "An error occurred while fetching time patterns." });
  }
});


router.post("/", verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({
        error: "You are not part of any company. Please check with your higher authorities."
      });
    }

    // verify already exists
    if (await TimePattern.exists({ PatternName: req.body.PatternName })) {
      return res.status(400).send({ error: `${req.body.PatternName} pattern is already exists` })
    }
    const { error } = TimePatternValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    if (Number(req.body.StartingTime) > Number(req.body.FinishingTime)) {
      return res.status(400).send({ error: "Finishing time must be later than starting time." });
    }
    const addPattern = await TimePattern.create({ ...req.body, company: companyId });
    return res.send({ message: `${req.body.PatternName} pattern has been added successfully`, pattern: addPattern })

  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    return res.status(500).send({ error: error.message })
  }
});

// GET working time pattern for employee
router.get("/employee/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid employee ID" });
  }
  try {
    const emp = await Employee.findById(req.params.id, "workingTimePattern")
      .populate("workingTimePattern").lean();
    if (!emp) {
      return res.status(404).send({ error: "Employee not found" });
    }
    if (!emp.workingTimePattern) {
      return res.status(404).send({ error: "Working time pattern has not been assigned to you yet" });
    }
    res.send(emp.workingTimePattern);
  } catch (error) {
    console.error("Error in fetch employee's workingTimePattern:", error);
    res.status(500).send({ error: error.message });
  }
});

// PUT update time pattern
router.put("/:id", verifyAdminHR, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid pattern ID" });
  }
  const companyId = getCompanyIdFromToken(req.headers["authorization"]);

  if (!companyId) {
    return res.status(400).send({
      error: "You are not part of any company. Please check with your higher authorities."
    });
  }

  try {
    const { error } = TimePatternValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const peoplesUsingPattern = await Employee.find({ workingTimePattern: req.params.id, isDeleted: false, company: companyId }, "FirstName LastName Email fcmToken company")
      .populate("company", "CompanyName logo");

    const updatedPattern = await TimePattern.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const notify = [];

    for (const member of peoplesUsingPattern) {
      if (!member?.Email) continue;

      const title = "WorkingTime Pattern updated";
      const notification = {
        company: member.company._id,
        title,
        message: "We would like to inform you that the company's official time pattern has been updated to enhance workflow and maintain consistency across departments.",
      };

      const companyName = member.company.CompanyName;
      const workStartTime = changeClientTimezoneDate(updatedPattern.StartingTime);
      const workFinishTime = changeClientTimezoneDate(updatedPattern.FinishingTime);
      const lateMarkTime = new Date(workStartTime.getTime() + updatedPattern.WaitingTime * 60000).toLocaleTimeString();
      const htmlcontent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 500px; margin: auto; padding: 20px; background: #fff; border-radius: 8px;">
            <div style="text-align: center;">
              <img src="${member.company.logo}" alt="Company Logo" style="max-width: 100px;" />
              <h2>${companyName}</h2>
              <h3>Updated Company Time Pattern</h3>
            </div>
            <div>
              <p>Dear Team,</p>
              <p>We would like to inform you that the company's official time pattern has been updated to enhance workflow and maintain consistency across departments.</p>
              <ul>
                <li><strong>Working Days:</strong> ${updatedPattern.WeeklyDays.join(", ")}</li>
                <li><strong>Working Hours:</strong> ${workStartTime.toLocaleTimeString()} – ${workFinishTime.toLocaleTimeString()} (including 1-hour lunch)</li>
                <li><strong>Break Time:</strong> ${updatedPattern.BreakTime}</li>
                <li><strong>Grace Period:</strong> ${updatedPattern.WaitingTime} minutes</li>
                <li><strong>Late Mark:</strong> Applies after ${lateMarkTime}</li>
                <li><strong>Effective From:</strong> ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")}</li>
              </ul>
              <p>Please make the necessary arrangements to follow the updated schedule. For any queries, contact the HR department.</p>
              <p>Thank you for your cooperation.</p>
            </div>
            <footer style="text-align: center; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} NexsHR. All rights reserved.</p>
            </footer>
          </div>
        </body>
        </html>
      `;

      await sendMail(notification.company,
        "administrative",
        "timeScheduleChanges", {
        From: `<${process.env.FROM_MAIL}> (Nexshr)`,
        To: member.Email,
        Subject: title,
        HtmlBody: htmlcontent,
      });

      const fullEmp = await Employee.findById(member._id, "notifications");
      fullEmp.notifications.push(notification);
      await fullEmp.save();

      // await sendPushNotification({
      //   token: member.fcmToken,
      //   title: notification.title,
      //   body: notification.message,
      // });

      await pushNotification(
        notification.company,
        "administrative",
        "timeScheduleChanges",
        {
          tokens: member.fcmToken,
          title: notification.title,
          body: notification.message
        }
      );

      notify.push(member.Email);
    }

    res.send({
      message: `${req.body.PatternName} Pattern updated successfully`,
      updatedPattern,
      notifiedPeoples: notify
    });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    console.error("Error in updating time pattern:", error);
    res.status(500).send({ error: error.message });
  }
});

// DELETE time pattern
router.delete("/:id", verifyAdminHR, async (req, res) => {
  if (!checkValidObjId(req.params.id)) {
    return res.status(400).send({ error: "Invalid pattern ID" });
  }

  try {
    const peoplesUsingPattern = await Employee.find({ workingTimePattern: req.params.id, isDeleted: false }, "workingTimePattern");

    if (peoplesUsingPattern.length > 0) {
      return res.status(400).send({ error: `${peoplesUsingPattern.length} employees are using this pattern. Please change timePattern for them before deletion.` });
    }

    const deletePattern = await TimePattern.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.send({ message: `${deletePattern.PatternName} pattern deleted successfully` });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    console.error("Error in deleting time pattern:", error);
    res.status(500).send({ error: error.message });
  }
});
module.exports = router;