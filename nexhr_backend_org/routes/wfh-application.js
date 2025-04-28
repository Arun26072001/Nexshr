const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require("../auth/authMiddleware");
const { WFHAppValidation, WFHApplication } = require("../models/WFHApplicationModel");
const { Employee } = require("../models/EmpModel");
const router = express.Router();

function generateWfhEmail(empData, fromDateValue, toDateValue, reason) {
    const fromDate = new Date(fromDateValue);
    const toDate = new Date(toDateValue);

    const formattedFromDate = `${fromDate.toLocaleString("default", { month: "long" })} ${fromDate.getDate()}, ${fromDate.getFullYear()}`;
    const formattedToDate = `${toDate.toLocaleString("default", { month: "long" })} ${toDate.getDate()}, ${toDate.getFullYear()}`;

    return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${empData.company.CompanyName} - Work From Home Request</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 500px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
                        box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;">
              
              <!-- Header -->
              <div style="text-align: center; padding: 20px;">
                <img src="${empData.company.CompanyName}"
                     alt="Company Logo" style="max-width: 100px;" />
                <h1 style="font-size: 20px; margin: 10px 0;">
                  Work From Home Request (${formattedFromDate} to ${formattedToDate})
                </h1>
                <h2 style="font-size: 16px; margin: 5px 0; color: #555;">
                  Requested by: ${empData.FirstName} ${empData.LastName}
                </h2>
              </div>
        
              <!-- Content -->
              <div style="margin: 20px 0; padding: 10px;">
                <p style="font-size: 14px; margin: 10px 0;"><strong>Reason for WFH:</strong> ${reason}</p>
                <p style="font-size: 14px; margin: 10px 0;">Thank you for your attention!</p>
              </div>
        
              <!-- Footer -->
              <div style="text-align: center; padding-top: 15px; border-top: 1px solid #ddd; margin-top: 20px;">
                <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} NexsHR. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

}

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // check request is already exist
        const existingRequest = await WFHApplication.findOne({
            employee: req.params.id,
            status: "approved",
            fromDate: { $gte: req.body.fromDate, $lte: req.body.toDate },
        })
        if (existingRequest) {
            return res.status(409).json({ error: "WFH request already exists for the given date range." });
        }
        // fetch team higher authorities
        const emp = await Employee.findById(req.params.id, "FirstName LastName monthlyPermissions permissionHour typesOfLeaveRemainingDays typesOfLeaveCount leaveApplication company")
            .populate([
                {
                    path: "admin",
                    select: "FirstName LastName Email",
                },
                {
                    path: "company",
                    select: "logo CompanyName"
                },
                {
                    path: "team",
                    populate: [
                        { path: "lead", select: "Email" },
                        { path: "head", select: "Email" },
                        { path: "manager", select: "Email" },
                    ],
                },
            ]);

        if (!emp) {
            return res.status(400).json({ error: `No employee found for ID ${empId}` });
        }

        // 10. Approvers setup
        const approvers = {};
        const teamRoles = ["lead", "head", "manager", "hr"];

        for (const role of teamRoles) {
            if (emp?.team?.[role]) {
                approvers[role] = "pending";
            }
        }

        const newApplication = {
            ...req.body,
            employee: req.params.id,
            approvers,
            status: "pending"
        }
        // check wfh application validation
        const { error } = WFHAppValidation.validate(newApplication);
        if (error) {
            return res.send({ error: error.details[0].message })
        } else {
            const application = await WFHApplication.create(newApplication);

            // 13. Send Notification (only for self-application)
            const mailList = [
                emp?.team?.lead?.Email,
                emp?.team?.head?.Email,
                emp?.team?.manager?.Email,
                emp?.admin?.Email,
            ].filter(Boolean);

            sendMail({
                From: process.env.FROM_MAIL,
                To: mailList.join(","),
                Subject: "Work From Home Request",
                HtmlBody: generateWfhEmail(emp, req.body.fromDate, req.body.toDate, req.body.reason),
            });
            return res.status(201).send({ message: "WFH request has been send to higher authority", application })
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// get all requests
router.get("/", verifyAdminHR, async (req, res) => {
    try {
        let filterObj = {};
        if (req.query.dateRangeValue) {
            const startDate = new Date(req.query.dateRangeValue[0]);
            const endDate = new Date(req.query.dateRangeValue[1]);
            filterObj = {
                fromDate: { $gte: startDate, $lte: endDate }
            }
        }
        const applications = await WFHApplication.find(filterObj)
            .populate("employee", "FirstName LastName")
            .lean()
            .exec();
        return res.send(applications);
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const { error } = WFHAppValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const updatedData = await WFHApplication.findByIdAndUpdate(req.body, { new: true });
        return res.send({ message: "WFH Request has been updated successfully", updatedData })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;