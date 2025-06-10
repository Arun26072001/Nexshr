const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { WFHAppValidation, WFHApplication } = require("../models/WFHApplicationModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { Team } = require("../models/TeamModel");
const { formatDate, mailContent, getDayDifference, sumLeaveDays } = require("../Reuseable_functions/reusableFunction");
const { sendPushNotification } = require("../auth/PushNotification");
const { Holiday } = require("../models/HolidayModel");
const { TimePattern } = require("../models/TimePatternModel");
const { LeaveApplication } = require("../models/LeaveAppModel");
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
        const { id } = req.params;
        const { fromDate, toDate, reason } = req.body;

        // 1. Check if a WFH request already exists
        const existingRequest = await WFHApplication.findOne({
            employee: id,
            fromDate: { $lte: toDate },
            toDate: { $gte: fromDate }
        });

        if (existingRequest) {
            return res.status(409).json({ error: "WFH request already exists for the given date range." });
        }

        // check has leave application is approved in the range
        const isLeave = await LeaveApplication.findOne({
            employee: id,
            fromDate: { $lte: toDate },
            toDate: { $gte: fromDate },
            status: "approved"
        })
        if(isLeave){
            return res.status(400).send({error: "You can't apply because you already have leave during this period."})
        }

        // check has more than two team members in wfh
        const team = await Team.findOne({ employees: id }, "employees").exec();

        const wfhEmps = await WFHApplication.find({
            employee: { $in: team.employees },
            status: "approved",
            fromDate: { $lte: toDate },
            toDate: { $gte: fromDate }
        })

        if (wfhEmps.length === 2) {
            return res.status(400).send({ error: "Already two members are approved for WFH in this time period." })
        }

        // 2. Fetch employee and team information
        const emp = await Employee.findById(id, "FirstName LastName Email company workingTimePattern")
            .populate([
                { path: "company", select: "logo CompanyName" },
                {
                    path: "team",
                    populate: [
                        { path: "lead", select: "FirstName LastName Email fcmToken" },
                        { path: "head", select: "FirstName LastName Email fcmToken" },
                        { path: "manager", select: "FirstName LastName Email fcmToken" },
                        { path: "admin", select: "FirstName LastName Email fcmToken" },
                        { path: "hr", select: "FirstName LastName Email fcmToken" },
                    ],
                },
            ]);

        if (!emp) {
            return res.status(404).json({ error: `No employee found for ID ${id}` });
        }

        // 3. Setup approvers
        const approvers = {};
        const teamRoles = ["lead", "head", "manager", "hr", "admin"];
        teamRoles.forEach(role => {
            if (emp?.team?.[role]) approvers[role] = "pending";
        });

        // 4. Prepare application
        const newApplication = {
            ...req.body,
            employee: id,
            approvers,
            status: "pending"
        };

        // check whf request is weekend or holiday
        function checkDateIsHoliday(dateList, target) {
            return dateList.some((holiday) => new Date(holiday.date).toLocaleDateString() === new Date(target).toLocaleDateString());
        }
        const holiday = await Holiday.findOne({ year: new Date().getFullYear() });
        const isFromDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
        const isToDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
        if (isFromDateHoliday) {
            return res.status(400).send({ error: "holiday are not allowed for fromDate" })
        } if (isToDateHoliday) {
            return res.status(400).send({ error: "holiday are not allowed for toDate" })
        }
        async function checkDateIsWeekend(date) {
            const timePattern = await TimePattern.findById(emp.workingTimePattern, "WeeklyDays").lean().exec();
            const isWeekend = !timePattern.WeeklyDays.includes(new Date(date).toLocaleDateString(undefined, { weekday: 'long' }));
            return isWeekend;
        }
        const [fromDateIsWeekend, toDateIsWeekend] = await Promise.all([checkDateIsWeekend(fromDate), checkDateIsWeekend(toDate)])
        if (fromDateIsWeekend) {
            return res.status(400).send({ error: "Weekend are not allowed in fromDate" })
        } if (toDateIsWeekend) {
            return res.status(400).send({ error: "Weekend are not allowed in toDate" })
        }

        // 5. Validate application
        const { error } = WFHAppValidation.validate(newApplication);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // 6. Save application
        const application = await WFHApplication.create(newApplication);

        // 7. Send notifications and emails
        const message = `${emp.FirstName} ${emp.LastName} has applied for WFH from ${formatDate(fromDate)} to ${formatDate(toDate)}.`;
        const title = "Work From Home Request Notification";
        const notify = [];
        for (const role of teamRoles) {
            const members = emp.team?.[role];
            const recipients = Array.isArray(members) ? members : [members];

            for (const member of recipients) {
                if (!member?.Email) continue;

                const notification = {
                    company: emp.company._id,
                    title,
                    message,
                };

                sendMail({
                    From: emp.Email,
                    To: member.Email,
                    Subject: title,
                    HtmlBody: generateWfhEmail(emp, fromDate, toDate, reason),
                });

                const fullEmp = await Employee.findById(member._id, "notifications");
                fullEmp.notifications.push(notification);
                await fullEmp.save();

                await sendPushNotification({
                    token: member.fcmToken,
                    title: notification.title,
                    body: notification.message,
                    // company: emp.company,
                });
                notify.push(member.Email);
            }
        }

        return res.status(201).json({ message: "WFH request has been sent to higher authority", application, notifiedMembers: notify });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

router.get("/on-wfh", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
        const data = await WFHApplication.find({
            fromDate: { $lte: endOfDay },
            toDate: { $gte: startOfDay },
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

router.get("/check-wfh/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
        let wfhEmp = false;
        const emp = await Employee.findById(req.params.id, "isPermanentWFH")
        const isWFH = await WFHApplication.findOne({
            employee: req.params.id,
            fromDate: { $lte: endOfDay },
            toDate: { $gte: startOfDay },
            status: "approved"
        })

        if (isWFH || emp.isPermanentWFH) {
            wfhEmp = true;
        }
        return res.send(wfhEmp);
    } catch (error) {
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
                fromDate: { $lte: endDate },
                toDate: { $gte: startDate }
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

        // pending wfh request days
        const pendingRequests = correctRequests.filter((item) => item.status === "pending");
        const approvedRequests = correctRequests.filter((item) => item.status === "approved");
        const upcomingRequests = correctRequests.filter(request => new Date(request.fromDate) > now);
        const [pendingrequestDays, approvedrequestDays, upcomingrequestDays] = await Promise.all([
            sumLeaveDays(pendingRequests),
            sumLeaveDays(approvedRequests),
            sumLeaveDays(upcomingRequests)
        ])

        return res.send({
            correctRequests,
            "pendingRequests": pendingrequestDays,
            "approvedRequests": approvedrequestDays,
            "upcommingRequests": upcomingrequestDays
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
                fromDate: { $lte: endDate },
                toDate: { $gte: startDate }
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

        const [pendingReqDays, upCommingReqDays, approvedReqDays] = await Promise.all([
            sumLeaveDays(pendingRequests),
            sumLeaveDays(approvedRequests),
            sumLeaveDays(upcommingRequests)
        ])

        return res.send({
            correctRequests,
            pendingRequests: pendingReqDays,
            approvedRequests: approvedReqDays,
            upcommingRequests: upCommingReqDays
        });
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

// get team of all employee requests
router.get("/team/:id", verifyTeamHigherAuthority, async (req, res) => {
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
                fromDate: { $lte: endDate },
                toDate: { $gte: startDate }
            }
        }
        const data = await WFHApplication.find(filterObj).populate("employee", "FirstName LastName profile").lean().exec();

        const withoutHisData = data.filter((item) => String(item.employee._id) !== req.params.id);
        const correctRequests = withoutHisData.map((item) => ({
            ...item,
            reason: item.reason.replace(/<\/?[^>]+(>|$)/g, '')
        })).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))
        const pendingRequests = correctRequests.filter((item) => item.status === "pending");
        const approvedRequests = correctRequests.filter((item) => item.status === "approved");
        const upcommingRequests = correctRequests.filter(request => new Date(request.fromDate) > now);

        const pendingReqDays = pendingRequests.reduce((total, request) => total + request.numOfDays, 0);
        const upCommingReqDays = upcommingRequests.reduce((total, request) => total + request.numOfDays, 0);
        const approvedReqDays = approvedRequests.reduce((total, request) => total + request.numOfDays, 0);
        return res.send({
            correctRequests,
            "pendingRequests": pendingReqDays,
            "approvedRequests": approvedReqDays,
            "upcommingRequests": upCommingReqDays
        });
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const { approvers, fromDate, toDate, status, employee, ...restBody } = req.body;
        let updatedApprovers = approvers;
        if (status === "approved") {
            // ✅ Check team WFH count
            const team = await Team.findOne({ employees: employee }, "employees");
            if (team?.employees?.length) {
                const overlappingWFHs = await WFHApplication.find({
                    employee: { $in: team.employees },
                    status: "approved",
                    fromDate: { $lte: toDate },
                    toDate: { $gte: fromDate },
                });

                if (overlappingWFHs.length >= 2) {
                    return res.status(400).json({ error: "Already two members are approved for WFH in this time period." });
                }
            }
            let approverData = {}
            console.log("approvers", approvers);
            Object.entries(approvers).map(([key, value]) => {
                approverData[key] = "approved"
            })
            updatedApprovers = approverData;
        } if (status === "rejected") {
            approverData = {}
            Object.entries(approvers).map(([key, value]) => {
                approverData[key] = "rejected"
            })
            updatedApprovers = approverData;
        }
        const allApproved = Object.values(approvers).every(status => status === "approved");
        const anyRejected = Object.values(approvers).some(status => status === "rejected");
        const allPending = Object.values(approvers).every(status => status === "pending");

        const wfhApp = await WFHApplication.findById(req.params.id);
        if (!wfhApp) return res.status(404).json({ error: "WFH application not found." });

        let updatedLeaveStatus = status;
        let members = [];

        if (!allPending) {
            const employeeId = wfhApp.employee;

            // ✅ Check team WFH count
            const team = await Team.findOne({ employees: employeeId }, "employees");
            if (team?.employees?.length) {
                const overlappingWFHs = await WFHApplication.find({
                    employee: { $in: team.employees },
                    status: "approved",
                    fromDate: { $lte: toDate },
                    toDate: { $gte: fromDate },
                });

                if (overlappingWFHs.length >= 2) {
                    return res.status(400).json({ error: "Already two members are approved for WFH in this time period." });
                }
            }

            // ✅ Determine updated status
            updatedLeaveStatus = allApproved
                ? "approved"
                : anyRejected
                    ? "rejected"
                    : status;

            const actionBy = req.query.actionBy;
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

            if (!emp) return res.status(404).json({ error: "Employee not found." });

            // check whf request is weekend or holiday
            function checkDateIsHoliday(dateList, target) {
                return dateList.some((holiday) => new Date(holiday.date).toLocaleDateString() === new Date(target).toLocaleDateString());
            }
            const holiday = await Holiday.findOne({ year: new Date().getFullYear() });
            const isFromDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
            const isToDateHoliday = checkDateIsHoliday(holiday.holidays, fromDate);
            if (isFromDateHoliday) {
                return res.status(400).send("holiday are not allowed for fromDate")
            } if (isToDateHoliday) {
                return res.status(400).send("holiday are not allowed for toDate")
            }
            async function checkDateIsWeekend(date) {
                const timePattern = await TimePattern.findById(emp.workingTimePattern, "WeeklyDays").lean().exec();
                const isWeekend = !timePattern.WeeklyDays.includes(new Date(date).toLocaleDateString(undefined, { weekday: 'long' }));
                return isWeekend;
            }
            const [fromDateIsWeekend, toDateIsWeekend] = await Promise.all([checkDateIsWeekend(fromDate), checkDateIsWeekend(toDate)])
            if (fromDateIsWeekend) {
                return res.status(400).send({ error: "Weekend are not allowed in fromDate" })
            } if (toDateIsWeekend) {
                return res.status(400).send({ error: "Weekend are not allowed in toDate" })
            }

            // ✅ Helper to normalize members
            const getMembers = (data, type) =>
                Array.isArray(data)
                    ? data.map(item => ({
                        type,
                        _id: item._id,
                        Email: item.Email,
                        name: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
                        fcmToken: item.fcmToken
                    }))
                    : data?.Email
                        ? [{
                            type,
                            _id: data._id,
                            Email: data.Email,
                            name: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
                            fcmToken: data.fcmToken
                        }]
                        : [];

            // ✅ Collect members and deduplicate by Email
            members = [
                emp.Email && { type: "emp", Email: emp.Email, name: `${emp.FirstName} ${emp.LastName}` },
                ...getMembers(emp.team?.lead, "lead"),
                ...getMembers(emp.team?.head, "head"),
                ...getMembers(emp.team?.manager, "manager"),
                ...getMembers(emp.team?.hr, "hr"),
                ...getMembers(emp.team?.admin, "admin")
            ]
                .filter(Boolean)
                .filter((v, i, arr) => arr.findIndex(t => t.Email === v.Email) === i);

            const emailType = allApproved ? "approved" : anyRejected ? "rejected" : "pending";

            // ✅ Notify each member
            if (members.length > 0) {
                const Subject = "Work From Home Response Notification";
                const fromStr = new Date(fromDate).toLocaleDateString();
                const toStr = new Date(toDate).toLocaleDateString();
                const statusText = anyRejected ? "rejected" : "approved";

                await Promise.all(members.map(async (member) => {
                    // Email
                    await sendMail({
                        From: process.env.FROM_MAIL,
                        To: member.Email,
                        Subject,
                        HtmlBody: mailContent(emailType, fromDate, toDate, emp, "WFH", actionBy, member)
                    });

                    // Notification
                    const message = `${emp.FirstName}'s WFH request from ${fromStr} to ${toStr} has been ${statusText} by ${actionBy}`;
                    const notification = {
                        company: emp.company._id,
                        title: Subject,
                        message
                    };

                    const fullEmp = await Employee.findById(member._id, "notifications");
                    if (fullEmp) {
                        fullEmp.notifications.push(notification);
                        await fullEmp.save();

                        await sendPushNotification({
                            token: member.fcmToken,
                            title: Subject,
                            body: message,
                            // company: emp.company
                        });
                    }
                }));
            }
        }

        // ✅ Update WFH application
        const updatedData = await WFHApplication.findByIdAndUpdate(
            req.params.id,
            { ...restBody, approvers: updatedApprovers, status: updatedLeaveStatus },
            { new: true }
        );

        res.send({
            message: "WFH Request has been updated successfully",
            updatedData,
            notifiedMembers: members
        });
    } catch (error) {
        console.error("Error in update WFH:", error);
        res.status(500).json({ error: error.message });
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