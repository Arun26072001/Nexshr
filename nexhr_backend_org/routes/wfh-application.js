const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { WFHAppValidation, WFHApplication } = require("../models/WFHApplicationModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { Team } = require("../models/TeamModel");
const { formatDate, mailContent } = require("../Reuseable_functions/reusableFunction");
const { sendPushNotification } = require("../auth/PushNotification");
const router = express.Router();

function generateWfhEmail(empData, fromDateValue, toDateValue, reason, type) {
    const fromDate = new Date(fromDateValue);
    const toDate = new Date(toDateValue);
    const isRejected = type === "rejected";


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
                <img src="${empData.company.logo}"
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
                <span style="font-size: 14px; margin: 10px 0;"><strong>Reason for WFH:</strong><span>${reason}</span></span>
                <p style="font-size: 14px; margin: 10px 0;">
                 Your request for Work From Home on ${new Date(fromDateValue).toLocaleString("default", { month: "long" })} ${new Date(fromDateValue).getDate()}, ${new Date(fromDateValue).getFullYear()}  has been 
                    ${isRejected
            ? "not approved due to Team Workload."
            : "approved."
        }
                </p>
                <p>

                    ${isRejected
            ? "Please connect with your reporting manager or HR if you need further clarification."
            : "Please ensure proper handover of tasks (if applicable) and adhere to any required guidelines during your time off or remote work."
        }
                </p>
                <p>
                    Regards,<br />
                    Kavya<br />
                    HR Department
                </p>

         
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
        const emp = await Employee.findById(req.params.id, "FirstName LastName Email monthlyPermissions permissionHour typesOfLeaveRemainingDays typesOfLeaveCount leaveApplication company")
            .populate([
                {
                    path: "company",
                    select: "logo CompanyName"
                },
                {
                    path: "team",
                    populate: [
                        { path: "lead", select: "FirstName LastName Email fcmToken" },
                        { path: "head", select: "FirstName LastName Email fcmToken" },
                        { path: "manager", select: "FirstName LastName Email fcmToken" },
                        { path: "admin", select: "FirstName LastName Email fcmToken" },
                        { path: "hr", select: "FirstName LastName Email fcmToken" }
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
                ...([].concat(emp?.team?.lead || []).map(emp => emp?.Email)),
                ...([].concat(emp?.team?.head || []).map(emp => emp?.Email)),
                ...([].concat(emp?.team?.manager || []).map(emp => emp?.Email)),
                ...([].concat(emp?.team?.hr || []).map(emp => emp?.Email)),
                ...([].concat(emp?.team?.admin || []).map(emp => emp?.Email)),
            ].filter(Boolean); // removes null/undefined/false              

            // check approve or rejected
            // const emailType = allApproved ? "approved" : anyRejected ? "rejected" : "pending";
            sendMail({
                From: emp.Email,
                To: mailList.join(","),
                Subject: "Work From Home Request Notification",
                HtmlBody: generateWfhEmail(emp, req.body.fromDate, req.body.toDate, req.body.reason),
            });
            // send notification for client 
            const message = `${emp.FirstName} ${emp.LastName} has applied for leave from ${formatDate(req.body.fromDate)} to ${formatDate(req.body.toDate)}.`;
            const teamData = emp.team || {};
            for (const [key, value] of Object.entries(teamData)) {
                if (Array.isArray(value) && key !== "employees") {
                    for (const empData of value) {
                        if (empData) {
                            const notification = {
                                company: emp.company._id,
                                title: "Work From Home Request Notification",
                                message
                            };

                            const fullEmp = await Employee.findById(empData._id, "notifications"); // Fetch fresh document to update notifications
                            fullEmp.notifications.push(notification);
                            await fullEmp.save();
                            await sendPushNotification({
                                token: empData.fcmToken,
                                title: notification.title,
                                body: notification.message
                            })
                        }
                    }
                }
            }
            return res.status(201).send({ message: "WFH request has been send to higher authority", application })
        }
    } catch (error) {
        console.log(error);

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
router.get("/team/:id/", verifyTeamHigherAuthority, async (req, res) => {
    try {
        const now = new Date()
        const who = req.query.who;
        const teams = await Team.find({ [who]: req.params.id })
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
        const { approvers, fromDate, toDate, ...restBody } = req.body;

        const allApproved = Object.values(approvers).every(status => status === "approved");
        const anyRejected = Object.values(approvers).some(status => status === "rejected");
        const allPending = Object.values(approvers).every(status => status === "pending");

        let members = [];
        let updatedLeaveStatus = restBody.status;

        if (!allPending) {
            updatedLeaveStatus = allApproved
                ? "approved"
                : anyRejected
                    ? "rejected"
                    : restBody.status;
            // Who took action?
            const actionBy = req.query.actionBy;

            const wfhApp = await WFHApplication.findById(req.params.id);
            if (!wfhApp) return res.status(404).send({ error: "WFH application not found." });

            const employeeId = wfhApp.employee;

            const emp = await Employee.findById(employeeId)
                .populate([
                    {
                        path: "team",
                        populate: [
                            { path: "lead", select: "FirstName LastName Email fcmToken" },
                            { path: "head", select: "FirstName LastName Email fcmToken" },
                            { path: "manager", select: "FirstName LastName Email fcmToken" },
                            { path: "admin", select: "FirstName LastName Email fcmToken" },
                            { path: "hr", select: "FirstName LastName Email fcmToken" },
                        ]
                    },
                    { path: "company", select: "CompanyName logo" },
                    { path: "admin", select: "FirstName LastName Email" }
                ])
                .lean();

            if (!emp) return res.status(404).send({ error: "Employee not found." });

            // Helper to normalize members
            const getMembers = (data, type) =>
                Array.isArray(data)
                    ? data.map(item => ({
                        type,
                        _id: item._id,
                        Email: item?.Email,
                        name: `${item?.FirstName ?? ""} ${item?.LastName ?? ""}`.trim(),
                        fcmToken: item.fcmToken
                    }))
                    : data?.Email
                        ? [{
                            type,
                            _id: item._id,
                            Email: data.Email,
                            name: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
                            fcmToken: item.fcmToken
                        }]
                        : [];

            // Collect all relevant members
            members = [
                emp.Email && { type: "emp", Email: emp.Email, name: `${emp.FirstName} ${emp.LastName}` },
                ...getMembers(emp.team?.lead, "lead"),
                ...getMembers(emp.team?.head, "head"),
                ...getMembers(emp.team?.manager, "manager"),
                ...getMembers(emp.team?.hr, "hr"),
                ...getMembers(emp.team?.admin, "admin")
            ]
                .filter(Boolean)
                .filter((v, i, self) => self.findIndex(t => t.Email === v.Email) === i); // Deduplicate

            console.log("members", members);

            // check approve or rejected
            const emailType = allApproved ? "approved" : anyRejected ? "rejected" : "pending";
            if (members.length > 0) {
                members.forEach(async (member) => {
                    const Subject = "Work From Home Response Notification"
                    await sendMail({
                        From: process.env.FROM_MAIL,
                        To: member.Email,
                        Subject,
                        HtmlBody: mailContent(emailType, fromDate, toDate, emp, "WFH", actionBy, member)
                    });

                    // send notification for client 
                    const message = anyRejected
                        ? `${emp.FirstName}'s WFH request ${new Date(fromDate).toLocaleDateString() - new Date(toDate).toLocaleDateString()} has been rejected by ${actionBy}`
                        : `${emp.FirstName}'s WFH request ${new Date(fromDate).toLocaleDateString() - new Date(toDate).toLocaleDateString()} has been approved by ${actionBy}`;

                    if (member) {
                        const notification = {
                            company: emp.company._id,
                            title: Subject,
                            message
                        };

                        const fullEmp = await Employee.findById(member._id, "notifications"); // Fetch fresh document to update notifications
                        fullEmp.notifications.push(notification);
                        await fullEmp.save();
                        await sendPushNotification({
                            token: member.fcmToken,
                            title: Subject,
                            body: message,
                            company: emp.company
                        })
                    }
                })
            }
        }

        // Update WFH application
        const updatedData = await WFHApplication.findByIdAndUpdate(
            req.params.id,
            { ...restBody, approvers, status: updatedLeaveStatus },
            { new: true }
        );

        return res.send({
            message: "WFH Request has been updated successfully",
            updatedData,
            notifiedMembers: members
        });
    } catch (error) {
        console.log("error in update wfh", error);
        return res.status(500).send({ error: error.message });
    }
});


router.delete("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const wfhRequest = await WFHApplication.findById(req.params.id);
        if (!wfhRequest) {
            return res.status(404).send({ error: "Request not found" })
        }
        // check is any one responsed
        if (wfhRequest.status !== "pending") {
            return res.status(400).send({ error: "You can't delete reponsed request." })
        }
        const deletedRequest = await WFHApplication.findByIdAndDelete(req.params.id);
        return res.send({ message: `WFH request has been deleted successfully` })

    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;