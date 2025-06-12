const express = require("express");
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Holiday, HolidayValidation } = require("../models/HolidayModel");
const sendMail = require("./mailSender");
const { sendPushNotification } = require("../auth/PushNotification");
const { Employee } = require("../models/EmpModel");
const router = express.Router();

router.post("/:id", verifyAdminHR, async (req, res) => {
    try {
        const isExist = await Holiday.findOne({ currentYear: req.body.currentYear });
        if (isExist) {
            return res.status(400).send({ error: "Already added this year of holidays!" })
        }
        const newHolidayData = {
            ...req.body,
            createdBy: req.params.id
        }

        const { error } = HolidayValidation.validate(newHolidayData);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }

        const response = await Holiday.create(newHolidayData);
        const notifyemps = [];
        const companyEmps = await Employee.find({ company: req.body.company }, "FirstName LastName Email fcmToken company notifications").populate("company", "CompanyName logo").exec();
        companyEmps.forEach(async (emp) => {
            const title = `${req.body.currentYear}'s of holidays created`;
            const message = `${emp.company.CompanyName} of ${req.body.currentYear} of holiday's has been created`;
            const notification = {
                title, message,
                company: emp.company._id
            }
            emp.notifications.push(notification);
            await emp.save();
            if (emp.Email) {
                notifyemps.push(emp.Email)
                sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: emp.Email,
                    Subject: title,
                    HtmlBody:
                        `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${emp.company.CompanyName} - Holiday List Created</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
              box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 20px;">
      <img src="${emp.company.logo}" alt="Company Logo" style="max-width: 100px;" />
      <h1 style="font-size: 20px; margin: 10px 0;">Holiday List for ${req.body.currentYear}</h1>
      <h2 style="font-size: 16px; margin: 5px 0; color: #555;">
        Dear ${emp.FirstName} ${emp.LastName},
      </h2>
    </div>

    <!-- Content -->
    <div style="margin: 20px 0; padding: 10px;">
      <p style="font-size: 14px; margin: 10px 0;">
        We are pleased to inform you that the holiday list for the year <strong>${req.body.currentYear}</strong> has been created:
      </p>

      <ul style="font-size: 14px; padding-left: 20px;">
        ${req.body.holidays.map(holiday => `
          <li><strong>${holiday.date}</strong> - ${holiday.title}</li>
        `).join('')}
      </ul>

      <p style="font-size: 14px; margin: 10px 0;">
        Please review and take note of these official holidays. If you have any questions or require clarifications, feel free to contact the HR department.
      </p>

      <p style="font-size: 14px; margin: 10px 0;">
        Thank you,<br />
        HR Team – ${emp.company.CompanyName}
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
                })
            }
            if (emp.fcmToken) {
                await sendPushNotification({
                    title,
                    token: emp.fcmToken,
                    body: message
                })
            }
        })
        return res.send({ message: "holiday has been added.", data: response.data });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.get("/:year", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const response = await Holiday.findOne({ currentYear: req.params.year }).exec();
        if (!response) {
            return res.status(200).send({ message: `Please add ${req.params.year} year of holidays!` })
        } else {
            return res.send(response);
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHR, async (req, res) => {
    try {
        const allYear = await Holiday.find().lean().exec();
        return res.send(allYear)
    } catch (error) {
        return res.status(500).send({ erorr: error.message })
    }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        // check it's exists
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).send({ error: `${req.body.currentYear} holidays not found` })
        }
        // check it has error
        const { error } = HolidayValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.message })
        }
        const updatedHolidays = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
        const notifyemps = [];
        const companyEmps = await Employee.find({ company: req.body.company }, "FirstName LastName Email fcmToken company notifications").populate("company", "CompanyName logo").exec();
        companyEmps.forEach(async (emp) => {
            const title = `${req.body.currentYear}'s of holidays updated`;
            const message = `${emp.company.CompanyName} of ${req.body.currentYear} of holiday's has been updated`;
            const notification = {
                title, message,
                company: emp.company._id
            }
            emp.notifications.push(notification);
            await emp.save();
            if (emp.Email) {
                notifyemps.push(emp.Email)
                sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: emp.Email,
                    Subject: title,
                    HtmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${emp.company.CompanyName} - Holiday List Updated</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
              box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 20px;">
      <img src="${emp.company.logo}" alt="Company Logo" style="max-width: 100px;" />
      <h1 style="font-size: 20px; margin: 10px 0;">Holiday List for ${req.body.currentYear} Updated</h1>
      <h2 style="font-size: 16px; margin: 5px 0; color: #555;">
        Dear ${emp.FirstName} ${emp.LastName},
      </h2>
    </div>

    <!-- Content -->
    <div style="margin: 20px 0; padding: 10px;">
      <p style="font-size: 14px; margin: 10px 0;">
        Please find below the updated list of holidays for the year <strong>${req.body.currentYear}</strong>:
      </p>

      <ul style="font-size: 14px; padding-left: 20px;">
        ${req.body.holidays.map(holiday => `
          <li><strong>${holiday.date}</strong> - ${holiday.title}</li>
        `).join('')}
      </ul>

      <p style="font-size: 14px; margin: 10px 0;">
        Kindly make note of these dates. If you have any questions, please contact HR.
      </p>

      <p style="font-size: 14px; margin: 10px 0;">
        Thank you,<br />
        HR Team – ${emp.company.CompanyName}
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
                })
            }
            if (emp.fcmToken) {
                await sendPushNotification({
                    title,
                    token: emp.fcmToken,
                    body: message
                })
            }
        })
        return res.send({ message: `${updatedHolidays.currentYear} of holidays has been updated`, notifyemps })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).send({ error: "holiday not found" })
        }
        const deletedHoliday = await Holiday.findByIdAndDelete(req.params.id).exec();
        return res.send({ message: `${deletedHoliday.currentYear} of holiday has been deleted successfully` })
    } catch (error) {
        console.log("error in delete", error);
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;