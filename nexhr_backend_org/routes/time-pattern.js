const express = require('express');
const router = express.Router();
const { TimePattern, TimePatternValidation } = require('../models/TimePatternModel');
const Joi = require('joi');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Employee } = require('../models/EmpModel');
const { sendPushNotification } = require('../auth/PushNotification');
const sendMail = require('./mailSender');

router.get("/", verifyAdminHREmployeeManagerNetwork, (req, res) => {
  TimePattern.find()
    .exec((err, pattern) => {
      if (err) {
        res.status(403).send({
          "message": "Time patterns not found!"
        })
      }
      else {
        res.send(pattern)
      }
    })
})

router.post("/", verifyAdminHR, async (req, res) => {
  try {
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
    const addPattern = await TimePattern.create(req.body);
    return res.send({ message: `${req.body.PatternName} pattern has been added successfully`, pattern: addPattern })

  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
  try {
    const { error } = TimePatternValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    const peoplesUsingPattern = await Employee.find({ workingTimePattern: req.params.id }, "FirstName LastName Email fcmToken company")
      .populate("company", "CompanyName logo")
      .exec();
    const updatedPattern = await TimePattern.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // send mail and notification for peoplesUsingPattern
    const emps = Array.isArray(peoplesUsingPattern) ? peoplesUsingPattern : [peoplesUsingPattern];
    let notify = [];
    emps.forEach(async member => {
      if (!member?.Email) return;
      const title = "WorkingTime Pattern updated";
      const notification = {
        company: member.company._id,
        title,
        message: " We would like to inform you that the company's official time pattern has been updated to enhance workflow and maintain consistency across departments.",
      };
      const companyName = member.company.CompanyName;
      const workStartTime = new Date(updatedPattern.StartingTime)
      const htmlcontent = `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName} – Updated Time Pattern</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
              box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">

    <!-- Header -->
    <div style="text-align: center; padding: 20px;">
      <img src="${member.company.logo}" alt="Company Logo" style="max-width: 100px;" />
      <h1 style="font-size: 20px; margin: 10px 0;">
        Updated Company Time Pattern
      </h1>
      <h2 style="font-size: 16px; margin: 5px 0; color: #555;">
        ${companyName}
      </h2>
    </div>

    <!-- Content -->
    <div style="margin: 20px 0; padding: 10px;">
      <p style="font-size: 14px; margin: 10px 0;">
        Dear Team,
      </p>
      <p style="font-size: 14px; margin: 10px 0;">
        We would like to inform you that the company's official time pattern has been updated to enhance workflow and maintain consistency across departments.
      </p>

      <div style="background-color: #f0f4f8; padding: 10px; border-radius: 6px; margin: 15px 0;">
        <ul style="list-style: none; padding-left: 0; font-size: 14px; line-height: 1.6;">
          <li><strong>Working Days:</strong> ${updatedPattern.WeeklyDays.join(", ")}</li>
          <li><strong>Working Hours:</strong> ${new Date(workStartTime).toLocaleTimeString()} – ${new Date(updatedPattern.FinishingTime).toLocaleTimeString()} (including 1-hour lunch)</li>
          <li><strong>Break Time:</strong> ${updatedPattern.BreakTime}</li>
          <li><strong>Grace Period:</strong> ${updatedPattern.WaitingTime} minutes</li>
          <li><strong>Late Mark:</strong> Applies after ${new Date(new Date(workStartTime).getTime() + updatedPattern.WaitingTime * 60000).toLocaleTimeString()}</li>
          <li><strong>Effective From:</strong> ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")}</li>
        </ul>
      </div>

      <p style="font-size: 14px; margin: 10px 0;">
        Please make the necessary arrangements to follow the updated schedule. For any queries, feel free to contact the HR department.
      </p>

      <p style="font-size: 14px; margin: 10px 0;">
        Thank you for your cooperation.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 15px; border-top: 1px solid #ddd; margin-top: 20px;">
      <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} NexsHR. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
      // sendMail({
      //   From: `<${process.env.FROM_MAIL}> (Nexshr)`,
      //   To: member.Email,
      //   Subject: title,
      //   HtmlBody: htmlcontent,
      // });
      const fullEmp = await Employee.findById(member._id, "notifications");
      fullEmp.notifications.push(notification);
      await fullEmp.save();
      await sendPushNotification({
        token: member.fcmToken,
        title: notification.title,
        body: notification.message,
      });
      notify.push(member.Email);
    });
    return res.send({ message: `${req.body.PatternName} Pattern updated successfully`, updatedPattern, notifiedPeoples: notify })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
  try {
    const peoplesUsingPattern = await Employee.find({ workingTimePattern: req.params.id }, "workingTimePattern").exec();

    if (peoplesUsingPattern.length > 0) {
      return res.status(400).send({ error: `${peoplesUsingPattern.length} Employees using this pattern. Please change them to delete` })
    }
    const deletePattern = await TimePattern.findByIdAndRemove(req.params.id);
    return res.send({ message: `${deletePattern.PatternName} pattern deleted successfully` })
  } catch (error) {
    console.log("error in delete timePattern", error);
    return res.status(500).send({ error: error.message })
  }
})

module.exports = router;