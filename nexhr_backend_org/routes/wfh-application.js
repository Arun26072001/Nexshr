const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { WFHAppValidation, WFHApplication } = require("../models/WFHApplicationModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { Team } = require("../models/TeamModel");
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
            return res.status(404).json({ error: `No employee found for ID ${empId}` });
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
            return res.status(400).send({ error: error.details[0].message })
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
                Subject: "Work From Home Request Notification",
                HtmlBody: generateWfhEmail(emp, req.body.fromDate, req.body.toDate, req.body.reason),
            });

            return res.status(201).send({ message: "WFH request has been send to higher authority", application })
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/on-wfh", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
        const data = await WFHApplication.find({
            fromDate: { $gte: startOfDay, $lte: endOfDay },
            status: "approved"
        }, "fromDate toDate status leaveType")
            .populate({
                path: "employee",
                select: "FirstName LastName profile",
                populate: {
                    path: "team",
                    select: "teamName"
                }
            }).lean().exec();
        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

// get all requests
router.get("/", verifyAdminHR, async (req, res) => {
    try {
        const now = new Date()
        let filterObj = {};
        if (req.query.dateRangeValue) {
            const startDate = new Date(req.query.dateRangeValue[0]);
            const endDate = new Date(req.query.dateRangeValue[1]);
            filterObj = {
                fromDate: { $gte: startDate, $lte: endDate }
            }
        }
        const applications = await WFHApplication.find(filterObj)
            .populate("employee", "FirstName LastName profile")
            .lean()
            .exec();
        const correctRequests = applications.map((item) => ({
            ...item,
            reason: item.reason.replace(/<\/?[^>]+(>|$)/g, '')
        })).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))

        const pendingRequests = correctRequests.filter((item) => item.status === "pending");
        const approvedRequests = correctRequests.filter((item) => item.status === "approved");
        const upcommingRequests = correctRequests.filter(request => new Date(request.fromDate) > now);
        return res.send({
            correctRequests,
            pendingRequests,
            approvedRequests,
            upcommingRequests
        });
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const data = await WFHApplication.findById(req.params.id);
        return res.send(data);
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// get employee of all requests
router.get("/employee/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const now = new Date();
        let filterObj = { employee: req.params.id };
        if (req.query?.dateRangeValue) {
            const startDate = new Date(req.query.dateRangeValue[0]);
            const endDate = new Date(req.query.dateRangeValue[1]);
            filterObj = {
                ...filterObj,
                fromDate: { $gte: startDate, $lte: endDate }
            }
        }
        const requests = await WFHApplication.find(filterObj)
            .populate("employee", "FirstName LastName profile")
            .lean()
            .exec();
        const correctRequests = requests.map((item) => ({
            ...item,
            reason: item.reason.replace(/<\/?[^>]+(>|$)/g, '')
        })).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))

        const pendingRequests = correctRequests.filter((item) => item.status === "pending");
        const approvedRequests = correctRequests.filter((item) => item.status === "approved");
        const upcommingRequests = correctRequests.filter(request => new Date(request.fromDate) > now);
        return res.send({
            correctRequests,
            pendingRequests,
            approvedRequests,
            upcommingRequests
        });
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// get team of all employee requests
router.get("/team/:id", verifyTeamHigherAuthority, async (req, res) => {
    try {
        const now = new Date()
        const teams = await Team.find({ [req.params.who]: req.params.id })
        if (!teams.length) {
            return res.status(404).send({ error: "You are not a Team higher authority." })
        }
        const employeesData = teams.map((team) => team.employees).flat();
        const uniqueEmps = [...new Set([...employeesData])]
        let filterObj = { employee: { $in: uniqueEmps } };
        if (req.query.dateRangeValue) {
            const startDate = new Date(req.query.dateRangeValue[0]);
            const endDate = new Date(req.query.dateRangeValue[1]);
            filterObj = {
                ...filterObj,
                fromDate: { $gte: startDate, $lte: endDate }
            }
        }
        const data = await WFHApplication.find(filterObj).populate("employee", "FirstName LastName profile").lean().exec();
        const correctRequests = data.map((item) => ({
            ...item,
            reason: item.reason.replace(/<\/?[^>]+(>|$)/g, '')
        })).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))

        const pendingRequests = correctRequests.filter((item) => item.status === "pending");
        const approvedRequests = correctRequests.filter((item) => item.status === "approved");
        const upcommingRequests = correctRequests.filter(request => new Date(request.fromDate) > now);
        return res.send({
            correctRequests,
            pendingRequests,
            approvedRequests,
            upcommingRequests
        });
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})


router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // const { error } = WFHAppValidation.validate(req.body);
        // if (error) {
        //     return res.status(400).send({ error: error.details[0].message })
        // }
        const updatedData = await WFHApplication.findByIdAndUpdate(req.body, { new: true });
        return res.send({ message: "WFH Request has been updated successfully", updatedData })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        if (await WFHApplication.exists({ _id: req.params.id })) {
            const deletedRequest = await WFHApplication.findByIdAndDelete(req.params.id);
            return res.send({ message: `WFH request has been deleted successfully` })
        } else {
            return res.status(404).send({ error: "Request not found" })
        }
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;