const express = require("express");
const router = express.Router();
const { getDistance } = require("geolib");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHrNetworkAdmin, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { ClockIns, clockInsValidation } = require("../models/ClockInsModel");
const { Employee } = require("../models/EmpModel");
const { getDayDifference } = require("./leave-app");
const sendMail = require("./mailSender");
const { LeaveApplication } = require("../models/LeaveAppModel");
const { Team } = require("../models/TeamModel");
const { timeToMinutes, getTotalWorkingHourPerDay, processActivityDurations, checkLoginForOfficeTime, getCurrentTime, sumLeaveDays } = require("../Reuseable_functions/reusableFunction");
const { WFHApplication } = require("../models/WFHApplicationModel");
const { sendPushNotification } = require("../auth/PushNotification");
const { Holiday } = require("../models/HolidayModel");
const { TimePattern } = require("../models/TimePatternModel");

router.post("/not-login/apply-leave/:workPatternId", async (req, res) => {
    try {
        const timePatternId = req.params.workPatternId;
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

        // check whf request is weekend or holiday
        function checkDateIsHoliday(dateList, target) {
            return dateList.some((holiday) => new Date(holiday.date).toLocaleDateString() === new Date(target).toLocaleDateString());
        }
        const holiday = await Holiday.findOne({ year: new Date().getFullYear() });
        const isTodayHoliday = checkDateIsHoliday(holiday.holidays, now);
        if (isTodayHoliday) {
            return res.status(200).send({ message: "No need to apply leave for holiday" })
        }
        async function checkDateIsWeekend(date) {
            const timePattern = await TimePattern.findById(timePatternId, "WeeklyDays").lean().exec();
            const isWeekend = !timePattern.WeeklyDays.includes(new Date(date).toLocaleDateString(undefined, { weekday: 'long' }));
            return isWeekend;
        }
        const todayIsWeekend = await checkDateIsWeekend(now);
        if (todayIsWeekend) {
            return res.status(200).send({ message: "No need to apply leave for Weekend" })
        }

        const allEmployees = await Employee.find(
            { workingTimePattern: timePatternId },
            "_id workingTimePattern FirstName LastName Email team leaveApplication company"
        )
            .populate("leaveApplication")
            .populate("company", "CompanyName logo")
            .populate({
                path: "team",
                populate: { path: "hr", select: "Email fcmToken" },
            });

        const notLoginEmps = [];

        for (const emp of allEmployees) {
            // Skip if employee has already clocked in today
            const hasClockIn = await ClockIns.exists({
                employee: emp._id,
                date: { $gte: startOfDay, $lt: endOfDay },
            });
            if (hasClockIn) continue;

            // Skip if employee already has an approved full-day leave today
            const leaveExists = await LeaveApplication.exists({
                employee: emp._id,
                fromDate: { $gte: startOfDay, $lt: endOfDay },
                status: "approved",
                leaveType: { $ne: "Permission Leave" },
            });

            if (!leaveExists) {
                notLoginEmps.push(emp);
            }
        }

        if (!notLoginEmps.length) {
            return res.send({ message: "No employees found without punch-in today." });
        }

        const leaveApplications = [];
        const emailPromises = [];

        for (const emp of notLoginEmps) {
            if (!emp.workingTimePattern) continue;

            const officeStartingTime = `${new Date(emp.workingTimePattern.StartingTime).getHours()}:${new Date(emp.workingTimePattern.StartingTime).getMinutes()}`;
            const officeFinishingTime = `${new Date(emp.workingTimePattern.FinishingTime).getHours()}:${new Date(emp.workingTimePattern.FinishingTime).getMinutes()}`;
            const workingHours = getTotalWorkingHourPerDay(
                officeStartingTime,
                officeFinishingTime
            );

            const fromDate = new Date(now.getTime() - ((workingHours || 9.5) * 60 * 60 * 1000));

            const leaveData = {
                leaveType: "Unpaid Leave (LWP)",
                fromDate,
                toDate: now,
                periodOfLeave: "full day",
                reasonForLeave: "Didn't punch in until EOD",
                employee: emp._id,
                status: "pending",
                approvers: {
                    TeamLead: "approved",
                    TeamHead: "approved",
                    Hr: "approved",
                    Manager: "approved",
                },
            };

            const leave = await LeaveApplication.create(leaveData);
            leaveApplications.push(leave);

            await Employee.findByIdAndUpdate(emp._id, {
                $set: { leaveApplication: [leave._id] },
            });

            const htmlContent = `
                <html>
                    <body>
                        <p>Dear HR,</p>
                        <h2>${emp.FirstName} ${emp.LastName} did not punch in on the HRM system by the end of the day.</h2>
                        <p>As a result, the HRM system has automatically applied a leave. Please confirm this action.</p>
                    </body>
                </html>
            `;

            const Subject = "Full-day Leave Applied (Unpaid Leave)";

            // Extract HR emails
            const hrEmails = (emp.team?.hr || []).map(hr => hr.Email).filter(Boolean);

            if (hrEmails.length > 0) {
                emailPromises.push(
                    sendMail({
                        From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                        To: hrEmails.join(", "),
                        Subject,
                        HtmlBody: htmlContent,
                    })
                );

                // Send push notifications
                emp.team.hr.forEach(hr => {
                    if (hr.fcmToken) {
                        sendPushNotification({
                            token: hr.fcmToken,
                            title: Subject,
                            body: `${emp.FirstName} ${emp.LastName} did not punch in on the HRM system by the end of the day.`,
                            // company: emp.company,
                        });
                    }
                });
            }
        }

        await Promise.all(emailPromises);

        res.send({
            message: `${leaveApplications.length} employee(s) had leave applied and notifications sent.`,
        });

    } catch (error) {
        console.error("Error in apply-leave route:", error);
        res.status(500).send({ error: error.message || "Server error." });
    }
});

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const { location, worklocation } = req.query;

        let regular = 0, late = 0, early = 0;
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
        if (!worklocation) {
            return res.status(400).send({ error: "Please select your work location" })
        }
        let isWfh;
        if (worklocation === "WFH") {
            isWfh = await WFHApplication.findOne({ fromDate: { $gte: today }, status: "approved" })
        }
        // Fetch employee details with required fields
        const emp = await Employee.findById(req.params.id, "FirstName LastName Email profile company clockIns leaveApplication isPermanentWFH")
            .populate("workingTimePattern")
            .populate("company", "location CompanyName")
            .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
            .populate({
                path: "leaveApplication",
                match: {
                    fromDate: { $lte: endOfDay },
                    toDate: { $gte: startOfDay },
                    status: "approved",
                    // leaveType: { $nin: ["Permission Leave"] }
                }
            }).exec();

        if (!emp) return res.status(404).send({ error: "Employee not found!" });
        // Office login time & employee login time 
        const officeLoginTime = getCurrentTime(emp?.workingTimePattern?.StartingTime) || "9:00";
        const loginTimeRaw = req.body?.login?.startingTime?.[0];

        if (emp.leaveApplication.length) {
            const permissionLeave = emp.leaveApplication.find((leave) => leave.leaveType.toLowerCase().includes("permission"));
            if (permissionLeave) {
                const [hour, min, sec] = loginTimeRaw.split(":").map(Number);
                const current = new Date().setHours(hour, min, sec, 0)
                const start = new Date(permissionLeave.fromDate);
                const end = new Date(permissionLeave.toDate); // fallback to start if no end

                // Normalize time for comparison
                start.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
                end.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), 0);

                if (current >= start && current <= end) {
                    return res.status(400).send({ error: "You have permission. Once finished, start the timer." })
                }
            } else {
                return res.status(400).send({ error: "You are in Leave today" })
            }
        }
        if (emp?.clockIns?.length > 0) return res.status(409).send({ message: "You have already Punch-In!" });

        // verify emp is in office
        if (worklocation === "WFH" && (!isWfh && !emp.isPermanentWFH)) {
            return res.status(400).send({ error: "You have no permission for WFH, Please reach office and start timer" })
        }

        //  if (worklocation === "WFO") {
        //     const userLocation = req.query.location;
        //     const companyLocation = emp.company.location;
        //     if (userLocation && companyLocation) {
        //         console.log("userLocation", userLocation, "officeLocation", companyLocation);
        //         const distance = getDistance(userLocation, companyLocation, accuracy = 1);
        //         console.log("distance", distance);
        //         if (distance > 100) {
        //             return res.status(400).send({ error: "Please reach your office location and start the timer" })
        //         }
        //     } else {
        //         return res.status(400).send({ error: `location not found in your ${ emp.company.CompanyName } ` })
        //     }
        // }

        if (!loginTimeRaw) return res.status(400).send({ error: "You must start Punch-in Timer" });
        const companyLoginMinutes = timeToMinutes(officeLoginTime) + Number(emp?.workingTimePattern?.WaitingTime);
        const empLoginMinutes = timeToMinutes(loginTimeRaw);

        if (companyLoginMinutes < empLoginMinutes) {
            const timeDiff = empLoginMinutes - companyLoginMinutes;
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date();

            if (timeDiff > 120 && timeDiff >= 240) {

                // Half-day leave due to late arrival
                const halfDayLeaveApp = {
                    leaveType: "Unpaid Leave (LWP)",
                    fromDate: today,
                    toDate: new Date(today.getTime() + (4 * 1000 * 60 * 60)),
                    periodOfLeave: "half day",
                    reasonForLeave: "Came too late",
                    prescription: "",
                    employee: emp._id,
                    coverBy: null,
                    status: "pending",
                    approvers: {
                        TeamLead: "approved",
                        TeamHead: "approved",
                        Hr: "approved",
                        Manager: "approved"
                    },
                    approvedOn: null,
                    approverId: []
                };

                const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                emp.leaveApplication.push(addLeave._id);
                await emp.save();
            } else {
                // Check existing approved permission leaves in the current month
                const empPermissions = await LeaveApplication.find({
                    employee: emp._id,
                    fromDate: { $gte: startOfMonth, $lt: endOfMonth },
                    leaveType: "Permission Leave",
                    status: "approved"
                });

                let leaveAppData, subject, htmlContent;

                if (empPermissions.length === 2) {

                    // Exceeded permission limit → Convert to Half-Day Leave
                    leaveAppData = {
                        leaveType: "Unpaid Leave (LWP)",
                        fromDate: today,
                        toDate: new Date(today.getTime() + (4 * 1000 * 60 * 60)),
                        periodOfLeave: "half day",
                        reasonForLeave: "Came too late",
                        prescription: "",
                        employee: emp._id,
                        coverBy: null,
                        status: "pending",
                        approvers: {
                            TeamLead: "approved",
                            TeamHead: "approved",
                            Hr: "approved",
                            Manager: "approved"
                        },
                        approvedOn: null,
                        approverId: []
                    };

                    subject = "Half-day Leave Applied (Unpaid Leave)";
                    htmlContent = `
                   <html>
                              <body>
                                <h2>You have exceeded your permission limit.</h2>
                                <p>
                                    This is to inform you that your punch-in on ${today} was recorded beyond the acceptable grace period.
                                    As per company policy, this will be considered a half-day Loss of Pay (LOP).
                                </p>
                                <p>
                                    We request you to adhere to the official working hours to avoid further attendance-related deductions.
                                    If there is a valid reason for the delay, please raise a request through the HRM portal or contact the HR team.
                                </p>
                                <p>Thank you for your understanding.</p>
                                <p>Regards,</p>
                                <p>Kavya</p>
                                <p>HR Department</p>
                            </body>
                            </html> `;
                } else {
                    // Allow Permission Leave (1st or 2nd)
                    const toDateTime = new Date(today.getTime() + 2 * 60 * 60 * 1000);
                    leaveAppData = {
                        leaveType: "Permission Leave",
                        fromDate: today,
                        toDate: toDateTime,
                        periodOfLeave: "half day",
                        reasonForLeave: "Came too late",
                        employee: emp._id,
                        status: "approved",
                        approvers: {
                            TeamLead: "approved",
                            TeamHead: "approved",
                            Hr: "approved",
                            Manager: "approved"
                        }
                    }

                    subject = empPermissions.length === 1 ? "2nd Permission Applied" : "1st Permission Applied";
                    htmlContent = `
                            <html>
                            <body>
                                <h2>${empPermissions.length === 1 ? "Second" : "First"} permission applied.</h2>
                                <p>You have arrived late and have been granted a 2-hour permission. Ensure timely arrival.</p>
                            </body>
                        </html> `;
                }

                // Save Leave Application
                const addLeave = await LeaveApplication.create(leaveAppData);
                emp.leaveApplication.push(addLeave._id);
                await emp.save();

                // Send Email Notification
                sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: emp.Email,
                    Subject: subject,
                    HtmlBody: htmlContent,
                });
            }
        }

        // Validate input data
        const { error } = clockInsValidation.validate(req.body);
        if (error) return res.status(400).send({ error: error.message });

        // Function to check login status
        const checkLoginStatus = (scheduledTime, actualTime, permissionTime = 0) => {
            if (!scheduledTime || !actualTime) return null;

            const scheduledMinutes = timeToMinutes(scheduledTime);
            const actualMinutes = timeToMinutes(actualTime);

            if ((scheduledMinutes + permissionTime) > actualMinutes) {
                regular++;
                return "On Time";
            } else if (actualMinutes > scheduledMinutes) {
                late++;
                return "Late";
            } else {
                early++;
                return "Early";
            }
        };

        // Determine employee behavior (Late, Early, On Time)
        const loginTime = loginTimeRaw;
        // const permissionMinutes = emp?.leaveApplication?.length
        //     ? ((new Date(emp.leaveApplication[0].toDate).getTime() - new Date(emp.leaveApplication[0].fromDate).getTime()) / 60000) / 60
        //     : 0;
        // console.log(emp?.leaveApplication[0]);

        const behaviour = checkLoginStatus(officeLoginTime, loginTime);
        const punchInMsg = await checkLoginForOfficeTime(officeLoginTime, loginTime);

        // Create clock-in entry
        const newClockIns = await ClockIns.create({
            ...req.body,
            behaviour,
            punchInMsg,
            employee: req.params.id
        });

        emp.clockIns.push(newClockIns._id);
        await emp.save();

        return res.status(201).send({ message: "Working timer started", clockIns: newClockIns });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
});

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const employeeId = req.params.id;
        const queryDate = new Date(req.query.date);
        if (isNaN(queryDate)) return res.status(400).send({ error: "Invalid date format." });

        // --- Handle previous day's incomplete login
        const prevDate = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate() - 1));
        const prevStart = new Date(prevDate);
        const prevEnd = new Date(prevDate);
        prevStart.setUTCHours(0, 0, 0, 0);
        prevEnd.setUTCHours(23, 59, 59, 999);

        const prevClockIn = await ClockIns.findOne({
            employee: employeeId,
            date: { $gte: prevStart, $lt: prevEnd },
        });

        if (prevClockIn && prevClockIn.login?.startingTime?.length !== prevClockIn.login?.endingTime?.length) {
            const activitiesData = processActivityDurations(prevClockIn);
            const totalMinutes = activitiesData.reduce((sum, a) => sum + a.timeCalMins, 0);
            const empTotalWorkingHours = (totalMinutes / 60).toFixed(2);
            return res.send({ timeData: prevClockIn, activitiesData, empTotalWorkingHours });
        }

        // --- Handle current day's clock-ins
        const dayStart = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));

        const employeeData = await Employee.findById(employeeId).populate({
            path: "clockIns",
            match: { date: { $gte: dayStart, $lt: dayEnd } },
            populate: { path: "employee", select: "_id FirstName LastName" },
        });

        const clockIn = employeeData?.clockIns?.[0];
        if (!clockIn) {
            return res.status(200).send({ status: false, message: "No clock-ins found for the given date." });
        }

        const activitiesData = processActivityDurations(clockIn);
        const totalMinutes = activitiesData.reduce((sum, a) => sum + a.timeCalMins, 0);
        const empTotalWorkingHours = (totalMinutes / 60).toFixed(2);

        return res.send({ timeData: clockIn, activitiesData, empTotalWorkingHours });

    } catch (err) {
        console.error("Error in GET /:id", err);
        return res.status(500).send({ error: err.message });
    }
});

router.get("/team/:id", verifyTeamHigherAuthority, async (req, res) => {
    try {
        let startOfMonth;
        let endOfMonth;
        const now = new Date();

        if (req?.query?.daterangeValue) {
            startOfMonth = new Date(req.query.daterangeValue[0]);
            endOfMonth = new Date(req.query.daterangeValue[1]);
        } else {
            startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        const who = req?.query?.who;
        const team = await Team.findOne({ [who]: req.params.id }).exec();

        if (!team) {
            return res.status(404).send({ error: "You are not a Team higher authority." })
        }
        const teamClockins = await ClockIns.find({
            employee: { $in: team.employees },
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).populate("employee", "FirstName LastName")
        return res.send(teamClockins);
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/item/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const convertToMinutes = (start, end) => {
        const [endHour, endMin] = end.split(/[:.]+/).map(Number);
        const [startHour, startMin] = start.split(/[:.]+/).map(Number);

        const startTime = new Date(2000, 0, 1, startHour, startMin);
        const endTime = new Date(2000, 0, 1, endHour, endMin);

        const diffMs = endTime - startTime; // Difference in milliseconds
        const diffMinutes = Math.floor(diffMs / (1000 * 60)); // Convert to minutes

        return diffMinutes > 0 ? diffMinutes : 0; // Ensure non-negative value
    };

    try {
        const timeData = await ClockIns.findById(req.params.id).populate({ path: "employee", select: "_id FirstName LastName" });
        if (!timeData) {
            return res.status(404).send({ message: "Not found", details: "Id is not found! Please verify it." });
        }

        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];

        const activitiesData = activities.map((activity, index) => {
            const startingTime = timeData[activity]?.startingTime[index] || "00:00";
            const endingTime = timeData[activity]?.endingTime[index] || "00:00";
            const timeCalMins = convertToMinutes(startingTime, endingTime);

            return {
                activity,
                startingTime,
                endingTime,
                timeCalMins
            };
        });

        // Sum up the total minutes for all activities
        const totalEmpWorkingMinutes = activitiesData.reduce((total, activity) => total + activity.timeCalMins, 0);

        // Convert total minutes to hours and minutes format
        const hours = Math.floor(totalEmpWorkingMinutes / 60);
        const minutes = totalEmpWorkingMinutes % 60;

        res.send({
            timeData,
            activitiesData,
            empTotalWorkingHours: (hours + minutes) / 60
        });

    } catch (err) {
        res.status(500).send({ message: "Internal server error", details: err.message });
    }
});

// get login and logout data from employee
router.get("/employee/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const now = new Date();
        const { empId } = req.params;
        const { daterangeValue } = req.query;

        const [startOfMonth, endOfMonth] = daterangeValue ?
            [new Date(daterangeValue[0]), new Date(daterangeValue[1])] :
            [new Date(now.getFullYear(), now.getMonth(), 1), now];

        let totalEmpWorkingHours = 0, totalLeaveDays = 0
        let regular = 0, late = 0, early = 0;

        const checkLogin = (scheduledTime, actualTime) => {
            const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
            const [actualHours, actualMinutes] = actualTime.split(':').map(Number);
            const scheduled = schedHours * 60 + schedMinutes;
            const actual = actualHours * 60 + actualMinutes;

            if (actual > scheduled) late++;
            else if (actual < scheduled) early++;
            else regular++;
        };

        const getTotalWorkingHoursExcludingWeekends = (start, end, dailyHours = 8) => {
            let totalHours = 0;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (![0, 6].includes(d.getDay())) totalHours += dailyHours;
            }
            return totalHours;
        };

        const employee = await Employee.findById(empId, "FirstName LastName clockIns leaveApplication")
            .populate([{ path: "workingTimePattern" },
            {
                path: "clockIns",
                match: { date: { $gte: startOfMonth, $lte: endOfMonth } },
                populate: { path: "employee", select: "FirstName LastName" }
            },
            {
                path: "leaveApplication",
                match: { fromDate: { $lte: endOfMonth }, toDate: { $gte: startOfMonth }, status: "approved", leaveType: { $ne: "Permission Leave" } },
                select: "fromDate toDate leaveType periodOfLeave"
            }])

        if (!employee) return res.status(400).send({ message: "Employee not found." });

        totalLeaveDays = Math.ceil(await sumLeaveDays(employee.leaveApplication));

        employee.clockIns.forEach(({ login }) => {
            const { startingTime, endingTime } = login;
            totalEmpWorkingHours += getTotalWorkingHourPerDay(startingTime[0], endingTime.at(-1));
            checkLogin("09:00", startingTime[0]);
        });

        res.send({
            totalRegularLogins: regular,
            totalLateLogins: late,
            totalEarlyLogins: early,
            companyTotalWorkingHour: getTotalWorkingHoursExcludingWeekends(startOfMonth, endOfMonth),
            totalWorkingHoursPerMonth: getTotalWorkingHoursExcludingWeekends(startOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0)),
            totalEmpWorkingHours,
            totalLeaveDays,
            clockIns: employee.clockIns.sort((a, b) => new Date(a.date) - new Date(b.date))
        });
    } catch (error) {
        console.error("Error fetching employee data:", error);
        res.status(500).send({ message: "Server error", details: error.message });
    }
});


router.get("/sendmail/:id/:clockinId", async (req, res) => {
    try {
        // Fetch employee leave data
        const emp = await Employee.findById(req.params.id).populate([{
            path: "clockIns",
            match: { _id: req.params.clockinId }
        }, {
            path: "company", select: "ComanyName logo"
        }]).exec()

        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
        const clockIn = emp.clockIns[0]; // Assuming the first clock-in for the day
        const activitiesData = activities.map((activity) => {
            const startingTime = clockIn[activity]?.startingTime[0] || "00:00";
            const endingTime = clockIn[activity]?.endingTime[clockIn[activity]?.endingTime.length - 1] || "00:00";
            const timeCalMins = timeToMinutes(clockIn[activity]?.timeHolder || "00:00:00");

            return {
                activity,
                startingTime,
                endingTime,
                timeCalMins,
            };
        })

        const htmlContent = `< !DOCTYPE html >
                        <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <title>${emp.company.CompanyName}</title>
                                    </head>
                                    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 20px;">
                                        <div style="display: flex; justify-content: center; margin: 20px;">
                                            <div style="flex: 1; max-width: 80%; margin: 0 auto;">
                                                <p style="font-size: 18px;">Hi ${emp.FirstName},</p>
                                                <p style="font-size: 18px;">Your timing details for today are here:</p>
                                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 16px; text-align: left; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                                    <thead>
                                                        <tr>
                                                            <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #4CAF50; color: white; font-weight: bold; text-transform: uppercase;">Activity</th>
                                                            <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #4CAF50; color: white; font-weight: bold; text-transform: uppercase;">Starting Time</th>
                                                            <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #4CAF50; color: white; font-weight: bold; text-transform: uppercase;">Ending Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${activitiesData && activitiesData.length > 0
                ? activitiesData
                    .map(
                        (data) => `
                          <tr style="background-color: ${data.index % 2 === 0 ? '#f2f2f2' : '#fff'};">
                            <td style="padding: 12px 15px; border: 1px solid #ddd;">${data.activity}</td>
                            <td style="padding: 12px 15px; border: 1px solid #ddd;">${data.startingTime}</td>
                            <td style="padding: 12px 15px; border: 1px solid #ddd;">${data.endingTime}</td>
                          </tr>
                        `
                    )
                    .join("")
                : `<tr><td colspan="3" style="text-align: center; padding: 12px 15px; border: 1px solid #ddd;">No activity data available</td></tr>`
            }
                                                    </tbody>
                                                </table>
                                                <p style="font-size: 18px;">Happy working!</p>
                                            </div>
                                        </div>
                                    </body>
                                </html>`

        sendMail({
            From: `<${process.env.FROM_MAIL}> (Nexshr)`,
            To: emp.Email,
            Subject: `You have punched in for the ${emp.clockIns[0].date}`,
            HtmlBody: htmlContent,
        });
        return res.send({ message: "We have send mail for you have completed 8 working hours." })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHrNetworkAdmin, async (req, res) => {
    try {
        let filterObj = {};

        if (req.query.daterangeValue) {
            const startDate = new Date(req.query.daterangeValue[0]);
            const endDate = new Date(req.query.daterangeValue[1])
            filterObj = {
                date: { $gte: startDate, $lte: endDate }
            }
        }
        let attendanceData = await ClockIns.find(filterObj)
            .populate({ path: "employee", select: "FirstName LastName" })
            .sort({ date: -1 });

        return res.send(attendanceData);
    } catch (error) {
        console.error("Error fetching attendance data:", error);
        res.status(500).send({ message: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const updatedClockIn = await ClockIns.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        if (!updatedClockIn) {
            return res.status(404).send({ message: "Clock-in entry not found" });
        }
        res.send(updatedClockIn);
    } catch (error) {
        console.error("Error updating ClockIns:", error);
        res.status(500).send({ message: "Internal server error", details: error.message });
    }
});


router.post("/ontime/:type", async (req, res) => {
    try {
        const date = new Date();
        const hour = date.getHours();
        const min = date.getMinutes();
        const { type } = req.params;
        let emps;
        if (type === "logout") {
            const today = new Date();
            const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
            const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
            emps = await Employee.find({}, "FirstName LastName Email")
                .populate("company")
                .populate("workingTimePattern")
                .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
        } else {
            emps = await Employee.find({}, "FirstName LastName Email")
                .populate("company")
                .populate("workingTimePattern");
        }

        const activeEmps = emps.filter((emp) => {
            if (type === "login") {
                return emp?.workingTimePattern?.StartingTime == `${hour}:${min}`
            } else {
                return emp?.workingTimePattern?.FinishingTime == `${hour}:${min}` && emp?.clockIns?.length > 0
            }
        })

        activeEmps.map((emp) => {
            sendMail({
                From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                To: emp.Email,
                Subject: type === "login" ? "Login Remainder" : "Logout Remainder",
                HtmlBody: `
                <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emp?.company?.CompanyName}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="margin: 20px 0;">
            <p>Dear ${emp.FirstName} ${emp.LastName},</p>
            ${type === "login" ? `
                <p>Please ensure that you log in on time at ${emp?.workingTimePattern?.StartingTime}.</p>
                <p>If you are delayed due to traffic or any unforeseen circumstances, please inform HR as soon as possible.</p>
            ` : `
                <p>Please ensure that you log out on time at ${emp?.workingTimePattern?.FinishingTime}.</p>
            `}
            <p>Kindly follow the necessary guidelines.</p><br />
            <p>Thank you!</p>
        </div>
        <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
            <p>Have questions or need assistance? <a href="mailto:${process.env.FROM_MAIL}">Contact ${process.env.FROM_MAIL}</a>.</p>
        </div>
    </div>
</body>
</html>
`  })
        })
        return res.send({ message: "Email sent successfully for all employees." })

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/remainder/:id/:timeOption", async (req, res) => {
    try {
        const { id, timeOption } = req.params;

        const emp = await Employee.findById(id, "FirstName LastName Email fcmToken company").populate("company");
        // send email notification
        const Subject = `Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended`;
        sendMail({
            From: `<${process.env.FROM_MAIL}> (Nexshr)`,
            To: emp.Email,
            Subject,
            HtmlBody: `<html lang="en">
                                    <head>
                                        <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                <title>${emp.company.CompanyName}</title>
                                            </head>
                                            <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                                                <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                                    <div style="margin: 20px 0;">
                                                        <p>Dear ${emp.FirstName} ${emp.LastName},</p>
                                                        <p>Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended. Please resume your work.</p>
                                                        <p>If you encounter any issues, please contact HR.</p>
                                                        <p>Kindly adhere to the necessary guidelines.</p><br />
                                                        <p>Thank you!</p>
                                                    </div>
                                                    <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                                                        <p>Have questions or need assistance? <a href="mailto:${process.env.FROM_MAIL}">Contact us</a>.</p>
                                                    </div>
                                                </div>
                                            </body>
                                        </html> `
        });

        // send notification even ask the reason for late
        await sendPushNotification({
            token: emp.fcmToken,
            // company: emp.company,
            title: Subject,
            body: `Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended. Please resume your work.`,
            type: "late reason"
        });
        res.send({ message: "Sent mail to employee successfully." })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})


module.exports = router;
