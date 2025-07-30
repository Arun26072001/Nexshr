const express = require("express");
const router = express.Router();
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHrNetworkAdmin, verifyTeamHigherAuthority, verifyAdminHR } = require("../auth/authMiddleware");
const { ClockIns, clockInsValidation } = require("../models/ClockInsModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { format } = require("date-fns");
const { LeaveApplication } = require("../models/LeaveAppModel");
const { Team } = require("../models/TeamModel");
const { timeToMinutes, processActivityDurations, checkLoginForOfficeTime, getCurrentTime, sumLeaveDays, getTotalWorkingHoursExcludingWeekends, changeClientTimezoneDate, getTotalWorkingHourPerDayByDate, errorCollector, isValidLeaveDate, setTimeHolderForAllActivities, isValidDate, getCurrentTimeInMinutes, checkDateIsHoliday, timeZoneHrMin } = require("../Reuseable_functions/reusableFunction");
const { WFHApplication } = require("../models/WFHApplicationModel");
const { sendPushNotification } = require("../auth/PushNotification");
const { Holiday } = require("../models/HolidayModel");
const { TimePattern } = require("../models/TimePatternModel");

router.post("/verify_completed_workinghour", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const { employee, login } = req.body;
        const today = changeClientTimezoneDate(new Date());
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 0));
        const empData = await Employee.findById(employee, "FirstName LastName workingTimePattern company")
            .populate("workingTimePattern")
            .populate({
                path: "leaveApplication", match: {
                    $and: [
                        { leaveType: { $in: ["permission", "Permission Leave"] } },
                        { fromDate: { $lte: endOfDay } },
                        { toDate: { $gte: startOfDay } },
                        { status: "approved" }
                    ]
                }
            })
            .exec();

        let startingTimes = login?.startingTime;
        let endingTimes = login?.endingTime;
        let permissionHrs = empData.leaveApplication.length > 0 ? getTotalWorkingHourPerDayByDate(empData.leaveApplication[0]) : 0

        const values = startingTimes?.map((startTime, index) => {
            if (!startTime) return 0; // No start time means no value

            let endTimeInMin = 0;
            if (endingTimes[index]) {
                // Calculate time difference with an ending time
                endTimeInMin = timeToMinutes(endingTimes[index]);
            } else {
                // Calculate time difference with the current time
                endTimeInMin = getCurrentTimeInMinutes();
            }
            const startTimeInMin = timeToMinutes(startTime);
            return Math.abs(endTimeInMin - startTimeInMin);
        });

        const totalValue = values?.reduce((acc, value) => acc + value, 0) / 60;
        const scheduleWorkingHours = getTotalWorkingHourPerDayByDate(
            empData?.workingTimePattern?.StartingTime,
            empData?.workingTimePattern?.FinishingTime
        )
        let isCompleteworkingHours = true;
        if ((scheduleWorkingHours + permissionHrs) > totalValue && !login?.reasonForEarlyLogout) {
            isCompleteworkingHours = false;
        }
        return res.send({ isCompleteworkingHours })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error in check working hour is complated", error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/not-login/apply-leave/:workPatternId", async (req, res) => {
    try {
        const timePatternId = req.params.workPatternId;
        const now = getCurrentTimeInMinutes();

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const checkDateIsWeekend = async (date) => {
            const timePattern = await TimePattern.findById(timePatternId, "WeeklyDays").lean();
            if (timePattern?.WeeklyDays) {
                const weekday = format(date, "EEEE");
                return !timePattern.WeeklyDays.includes(weekday);
            }
            return false;
        };

        if (await checkDateIsWeekend(now)) {
            return res.status(200).send({ message: "No need to apply leave for Weekend" });
        }

        const allEmployees = await Employee.find({ workingTimePattern: timePatternId },
            "_id workingTimePattern FirstName LastName Email team leaveApplication company")
            .populate("leaveApplication")
            .populate("workingTimePattern")
            .populate({
                path: "team",
                populate: { path: "hr", select: "FirstName LastName Email fcmToken" },
            });

        const notLoginEmps = [];

        for (const emp of allEmployees) {
            if (!emp.company) continue;

            const hasClockIn = await ClockIns.exists({
                employee: emp._id,
                date: { $gte: startOfDay, $lt: endOfDay },
            });
            if (hasClockIn) continue;

            const holiday = await Holiday.findOne({ currentYear: now.getFullYear(), company: emp.company });
            const isTodayHoliday = holiday ? checkDateIsHoliday(holiday.holidays, now) : false;
            if (isTodayHoliday) continue;

            const leaveExists = await LeaveApplication.exists({
                employee: emp._id,
                fromDate: { $gte: startOfDay, $lt: endOfDay },
                status: "approved",
                leaveType: { $ne: "Permission Leave" },
            });

            if (!leaveExists) notLoginEmps.push(emp);
        }

        if (!notLoginEmps.length) {
            return res.send({ message: "No employees found without punch-in today." });
        }

        const emailPromises = [];
        const leaveApplications = await Promise.all(notLoginEmps.map(async (emp) => {
            if (!emp.workingTimePattern && !emp.workingTimePattern.StartingTime) return null;
            const [startHour, startMin] = timeZoneHrMin(emp.workingTimePattern.StartingTime).split(":").map((value) => Number(value));
            const [endHour, endMin] = timeZoneHrMin(emp.workingTimePattern.FinishingTime).split(":").map((value) => Number(value));

            const from = new Date();
            from.setHours(startHour, startMin);
            const to = new Date();
            to.setHours(endHour, endMin);

            const leave = await LeaveApplication.create({
                leaveType: "Unpaid Leave (LWP)",
                fromDate: from,
                toDate: to,
                periodOfLeave: "full day",
                reasonForLeave: "Didn't punch in until EOD",
                employee: emp._id,
                status: "approved",
                approvers: {
                    lead: "approved",
                    head: "approved",
                    hr: "approved",
                    manager: "approved",
                },
            });

            await Employee.findByIdAndUpdate(emp._id, { $set: { leaveApplication: [leave._id] } });

            const Subject = "Full-day Leave Applied (Unpaid Leave)";
            const htmlContent = `
        <html>
          <body>
            <p>Dear HR,</p>
            <h2>${emp.FirstName} ${emp.LastName} did not punch in on the HRM system by the end of the day.</h2>
            <p>As a result, the HRM system has automatically applied a leave. Please confirm this action.</p>
          </body>
        </html>`;

            const hrEmails = emp.team?.hr?.map(hr => hr.Email).filter(Boolean) || [];

            if (hrEmails.length > 0) {
                emailPromises.push(sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: hrEmails.join(", "),
                    Subject,
                    HtmlBody: htmlContent,
                }));

                emp.team.hr.forEach(hr => {
                    if (hr.fcmToken) {
                        sendPushNotification({
                            token: hr.fcmToken,
                            title: Subject,
                            body: `${emp.FirstName} ${emp.LastName} did not punch in on the HRM system by the end of the day.`,
                            path: `${process.env.FRONTEND_BASE_URL}/emp/job-desk/leave`,
                        });
                    }
                });
            }

            return leave;
        }));

        await Promise.all(emailPromises);

        res.send({
            message: `${leaveApplications.filter(Boolean).length} employee(s) had leave applied and notifications sent.`,
        });
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT,
        });
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
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 0));

        if (!worklocation) {
            return res.status(400).send({ error: "Please select your work location" })
        }
        let isWfh;
        if (worklocation === "WFH") {
            isWfh = await WFHApplication.findOne({ fromDate: { $gte: today }, status: "approved" })
        }

        // Fetch employee details with required fields
        const emp = await Employee.findById(req.params.id, "FirstName LastName Email profile company clockIns leaveApplication isPermanentWFH warnings")
            .populate([{ path: "workingTimePattern" },
            { path: "company", select: "location CompanyName" },
            { path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } },
            { path: "team" },
            {
                path: "leaveApplication", match: {
                    $and: [
                        { fromDate: { $lte: endOfDay } },
                        { toDate: { $gte: startOfDay } },
                        { status: "approved" }
                    ]
                }
            }
            ]).exec();
        if (!emp) return res.status(404).send({ error: "Employee not found!" });
        // check emp's warnings limit reach
        if (!Number(emp.warnings)) {
            return res.status(400).send({ error: "You have reached your warning limit, so you cannot start the timer." })
        }
        let holidays = [];
        const weeklyDays = emp.workingTimePattern && emp.workingTimePattern.WeeklyDays ? emp.workingTimePattern.WeeklyDays : [];
        if (emp.company) {
            const holidayData = await Holiday.findOne({ company: emp.company?._id, currentYear: new Date().getFullYear() }).exec();
            if (holidayData && holidayData.holidays) {
                holidays = holidayData?.holidays
            }
        }
        // check current day is workingday
        if (isValidLeaveDate(holidays, weeklyDays, today)) {
            return res.status(400).send({ error: "Today is the not an working day" })
        }

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

        // Validate input data
        const { error } = clockInsValidation.validate(req.body);
        if (error) return res.status(400).send({ error: error.message });

        // Function to check login status
        const checkLoginStatus = (scheduledTime, actualTime, permissionTime = 0) => {
            if (!scheduledTime || !actualTime) return null;

            const scheduledMinutes = timeToMinutes(scheduledTime);
            const actualMinutes = timeToMinutes(actualTime);
            console.log("scheduledMinutes", scheduledMinutes, "actualMinutes", actualMinutes)
            if ((scheduledMinutes + permissionTime) > actualMinutes) {
                early++;
                return "Early";
            } else if (actualMinutes > scheduledMinutes) {
                late++;
                return "Late";
            } else if (actualMinutes === scheduledMinutes) {
                regular++;
                return "On Time";
            }
        };

        const behaviour = checkLoginStatus(officeLoginTime, loginTimeRaw);
        const punchInMsg = await checkLoginForOfficeTime(officeLoginTime, loginTimeRaw);
        const isLateLogin = behaviour === "Late" ? true : false

        // Create clock-in entry
        const newClockIns = await ClockIns.create({
            ...req.body,
            behaviour,
            punchInMsg,
            employee: req.params.id
        });

        emp.clockIns.push(newClockIns._id);
        await emp.save();

        return res.status(201).send({ message: "Working timer started", isLateLogin, clockIns: newClockIns });

    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
});

router.get("/late-punch", verifyAdminHR, async (req, res) => {
    try {
        let fromDate;
        let toDate;

        if (req?.query?.dateRangeValue) {
            fromDate = new Date(req.query.dateRangeValue[0]);
            toDate = new Date(req.query.dateRangeValue[1]);
        } else {
            fromDate = new Date();
            toDate = new Date();
        }
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 0);

        const latePunch = await ClockIns.find({ date: { $gte: fromDate, $lt: toDate }, behaviour: "Late" })
            .populate("employee", "FirstName LastName profile")
            .sort({ date: -1 }).lean().exec();


        return res.send(latePunch);
    } catch (error) {
        console.error("error in fetch late-punch", error);
        return res.status(500).send({ error: error.message })
    }
})

router.put("/late-punchin-response/:id", verifyAdminHR, async (req, res) => {
    try {
        const clockinData = req.body;
        const today = getCurrentTimeInMinutes();
        // check clockinData is exists
        const isExists = await ClockIns.exists({ _id: req.body._id });
        if (!isExists) {
            return res.status(404).send({ error: "Attendance data not found" })
        }
        const updatedClockins = await ClockIns.findByIdAndUpdate(req.params.id, clockinData, { new: true });
        // check lateLogin status
        if (updatedClockins.lateLogin.status === "rejected") {
            const emp = await Employee.findById(clockinData.employee._id, "FirstName LastName Email fcmToken team workingTimePattern");
            if (!emp) {
                return res.status(404).send({ error: "Employee data could not be found. Please refresh the page and try again." })
            }
            // Office login time & employee login time 
            let workingTimeStart = 0;
            let waitingTime = 0;
            if (emp?.workingTimePattern && Object.keys(emp?.workingTimePattern).length > 0) {
                workingTimeStart = getCurrentTime(emp?.workingTimePattern?.StartingTime);
                waitingTime = Number(emp?.workingTimePattern?.WaitingTime);
            }
            const officeLoginTime = workingTimeStart || "9:00";
            const loginTimeRaw = req.body?.login?.startingTime?.[0];
            const companyLoginMinutes = timeToMinutes(officeLoginTime) + waitingTime;
            const empLoginMinutes = timeToMinutes(loginTimeRaw);

            // check emp's login time is greater than office time
            if (companyLoginMinutes < empLoginMinutes) {
                const timeDiff = empLoginMinutes - companyLoginMinutes;

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
                        status: "approved",
                        approvers: {
                            lead: "approved",
                            head: "approved",
                            hr: "approved",
                            manager: "approved"
                        },
                        approvedOn: null,
                        approverId: []
                    };
                    console.log("applied in leave")
                    const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                    emp.leaveApplication.push(addLeave._id);
                    await emp.save();
                } else {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const endOfMonth = new Date();
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
                            status: "approved",
                            approvers: {
                                lead: "approved",
                                head: "approved",
                                hr: "approved",
                                manager: "approved"
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
                                        This is to inform you that your punch-in on ${today.toLocaleDateString()} was recorded beyond the acceptable grace period.
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
                                lead: "approved",
                                head: "approved",
                                hr: "approved",
                                manager: "approved"
                            },
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

                    console.log("applied permission")
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
        }
        return res.send({ message: `late punch has been ${req.body.lateLogin.status} successfully` })
    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT
        });
        console.error("error in apply leave for late login", error)
        return res.status(500).send({ error: error.message });
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const employeeId = req.params.id;
        const queryDate = changeClientTimezoneDate(req.query.date);
        // console.log("queryDate", new Date(req.query.date))
        if (isNaN(queryDate)) {
            return res.status(400).send({ error: "Invalid date format." });
        }

        const currentTime = changeClientTimezoneDate(new Date());

        const dayStart = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));
        // Fetch employee data and clock-ins
        const employeeData = await Employee.findById(employeeId)
            .populate({
                path: "clockIns", match: { date: { $gte: dayStart, $lt: dayEnd } },
                populate: { path: "employee", select: "_id FirstName LastName" }
            }).populate({ path: "workingTimePattern" }).lean().exec();

        if (!employeeData || !employeeData.workingTimePattern) {
            return res.status(404).send({ error: "Employee or working time pattern not found." });
        }

        const startOfficeAt = new Date(employeeData.workingTimePattern.StartingTime);
        const workingTimeLimit = new Date(startOfficeAt);
        workingTimeLimit.setDate(workingTimeLimit.getDate() + 1);
        workingTimeLimit.setHours(startOfficeAt.getHours() - 3);

        const empOvertimeWorkingLimit = new Date(startOfficeAt);
        empOvertimeWorkingLimit.setHours(empOvertimeWorkingLimit.getHours() + 12);

        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];

        const prevClockIn = await ClockIns.findOne({ employee: employeeId }).sort({ _id: -1 }).exec();
        if (prevClockIn) {
            const isSameToday = new Date(prevClockIn.date).toLocaleDateString() === dayStart.toLocaleDateString();
            if (!isSameToday) {

                const unstopPrevActivities = activities.filter(
                    (activity) => prevClockIn[activity]?.startingTime?.length !== prevClockIn[activity]?.endingTime?.length
                );

                if (unstopPrevActivities.length > 0) {
                    const activitiesData = processActivityDurations(prevClockIn);
                    const empTotalWorkingHours = (activitiesData.reduce((sum, a) => sum + a.timeCalMins, 0) / 60).toFixed(2);
                    if (workingTimeLimit > currentTime && empOvertimeWorkingLimit > currentTime) {
                        return res.send({
                            timeData: prevClockIn,
                            activitiesData,
                            empTotalWorkingHours
                        });
                    } else {
                        return res.send({
                            timeData: prevClockIn,
                            activitiesData,
                            empTotalWorkingHours,
                            types: unstopPrevActivities
                        })
                    }
                }
            }
        }

        // Handle current day's clock-in
        const clockIn = employeeData?.clockIns?.[0];

        if (!clockIn) {
            return res.status(200).send({ status: false, message: "No clock-ins found for the given date." });
        }

        const unstopActivities = activities.filter(
            (activity) => clockIn[activity]?.startingTime?.length !== clockIn[activity]?.endingTime?.length
        );

        const activitiesData = processActivityDurations(clockIn);
        const empTotalWorkingHours = (activitiesData.reduce((sum, a) => sum + a.timeCalMins, 0) / 60).toFixed(2);

        if (unstopActivities.length > 0 && empOvertimeWorkingLimit < currentTime && workingTimeLimit > currentTime) {
            return res.send({
                // message: "Are you still working? It seems like you’ve been working overtime.",
                timeData: clockIn,
                activitiesData,
                empTotalWorkingHours
            });
        }

        return res.send({ timeData: clockIn, activitiesData, empTotalWorkingHours });

    } catch (error) {
        await errorCollector({
            url: req.originalUrl,
            name: error.name,
            message: error.message,
            env: process.env.ENVIRONMENT
        });
        console.error("Error in GET /:id", error);
        return res.status(500).send({ error: error.message });
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
        let teamClockins = await ClockIns.find({
            employee: { $in: team.employees },
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).populate("employee", "FirstName LastName profile");
        return res.send(teamClockins);
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
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
        await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ message: "Internal server error", details: err.message });
    }
});

// get login and logout data from employee
router.get("/employee/:empId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const now = new Date();
        const { empId } = req.params;
        const { daterangeValue } = req.query;
        const [startOfMonth, endOfMonth] = daterangeValue && Array.isArray(daterangeValue) ?
            [new Date(daterangeValue[0]), new Date(new Date(daterangeValue[1]))] :
            [new Date(now.getFullYear(), now.getMonth(), 1), now];
        if (daterangeValue?.length > 0) {
            // reduce one day from start the date for exact filter
            startOfMonth.setDate(startOfMonth.getDate() - 1)
            // add one day from end the date for exact filter
            endOfMonth.setDate(endOfMonth.getDate() + 1)
        }
        let totalEmpWorkingHours = 0;
        let totalLeaveDays = 0;
        let regular = 0, late = 0, early = 0;
        const checkLogin = (scheduledTime, actualTime) => {
            let actualHours = actualMinutes = 0;
            let schedHours = schedMinutes = 0;
            if (isValidDate(actualTime)) {
                const actualDate = timeZoneHrMin(actualTime);
                [actualHours, actualMinutes] = actualDate.split(/[:.]+/).map(Number);
            } else {
                [actualHours, actualMinutes] = actualTime.split(/[:.]+/).map(Number);
            } if (isValidDate(scheduledTime)) {
                [schedHours, schedMinutes] = timeZoneHrMin(scheduledTime).split(/[:.]+/).map(Number);
            } else {
                [schedHours, schedMinutes] = scheduledTime.split(/[:.]+/).map(Number);
            }
            const scheduled = schedHours * 60 + schedMinutes;
            const actual = actualHours * 60 + actualMinutes;
            if (actual > scheduled) {
                late++;
            }
            else if (actual < scheduled) {
                early++;
            } else {
                regular++;
            }
        };

        const employee = await Employee.findById(empId, "FirstName LastName profile clockIns leaveApplication workingTimePattern company")
            .populate([
                { path: "workingTimePattern" },
                {
                    path: "clockIns",
                    match: { date: { $gte: startOfMonth, $lte: endOfMonth } },
                    populate: { path: "employee", select: "FirstName LastName" }
                },
                {
                    path: "leaveApplication",
                    match: { fromDate: { $lte: endOfMonth }, toDate: { $gte: startOfMonth }, status: "approved", leaveType: { $ne: "Permission Leave" } },
                    select: "fromDate toDate leaveType periodOfLeave employee"
                }])

        if (!employee) return res.status(400).send({ message: "Employee not found." });
        const holiday = await Holiday.findOne({ company: employee?.company, currentYear: now.getFullYear() })
        const empCurrentYearHolidays = holiday?.holidays && Array.isArray(holiday?.holidays) ? holiday.holidays : []

        totalLeaveDays = Math.ceil(await sumLeaveDays(employee.leaveApplication));
        let scheduledWorkingHours, scheduledLoginTime, weeklyDays;
        if (employee.workingTimePattern) {
            const startingDate = new Date(employee.workingTimePattern.StartingTime);
            const endingDate = new Date(employee.workingTimePattern.FinishingTime);
            weeklyDays = employee.workingTimePattern.WeeklyDays ? employee.workingTimePattern.WeeklyDays : []
            scheduledLoginTime = timeZoneHrMin(employee.workingTimePattern.StartingTime);
            scheduledWorkingHours = (endingDate.getTime() - startingDate.getTime()) / (1000 * 60 * 60)
        }
        employee.clockIns.forEach(({ login }) => {
            const timeHolderValue = timeToMinutes(login?.timeHolder || "00:00:00") / 60;
            totalEmpWorkingHours += timeHolderValue;
            const empLoginTime = login?.startingTime?.length ? login?.startingTime[0] : "00:00:00";
            checkLogin(scheduledLoginTime, empLoginTime);
        });
        const clockIns = employee.clockIns.length > 0 ? employee.clockIns : [];
        res.send({
            totalRegularLogins: regular,
            totalLateLogins: late,
            totalEarlyLogins: early,
            companyTotalWorkingHour: getTotalWorkingHoursExcludingWeekends(startOfMonth, endOfMonth, scheduledWorkingHours, empCurrentYearHolidays, weeklyDays),
            totalWorkingHoursPerMonth: getTotalWorkingHoursExcludingWeekends(startOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0), scheduledWorkingHours, empCurrentYearHolidays, weeklyDays),
            totalEmpWorkingHours,
            totalLeaveDays,
            companyWorkingHrPerDay: scheduledWorkingHours,
            clockIns
        });
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("Error fetching employee data:", error);
        res.status(500).send({ error: error.message });
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
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHrNetworkAdmin, async (req, res) => {
    try {
        let filterObj = {};
        const dateRangeValue = req.query?.dateRangeValue
        if (dateRangeValue && dateRangeValue.length > 1) {
            const startDate = new Date(dateRangeValue[0])
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRangeValue[1])
            endDate.setHours(23, 59, 59, 0);
            filterObj = {
                date: { $gte: startDate, $lte: endDate }
            }
        }
        let attendanceData = await ClockIns.find(filterObj)
            .populate({ path: "employee", select: "FirstName LastName profile" })
            .sort({ date: -1 });

        return res.send(attendanceData);
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("Error fetching attendance data:", error);
        res.status(500).send({ message: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const queryData = req.query;
        if (await ClockIns.exists({ _id: req.params.id })) {
            const updatedData = setTimeHolderForAllActivities(req.body);

            // check today's timer stopped
            if (updatedData.login.startingTime.length !== updatedData.login.endingTime.length) {
                if (updatedData.isStopTimer) {
                    return res.status(400).send({ error: "You have stopped today's timer" })
                }
            }
            // check time  getting stop and other activies are running
            if (updatedData.login.startingTime.length === updatedData.login.endingTime.length) {
                const activitiesExpLogin = ["meeting", "morningBreak", "lunch", "eveningBreak", "event"]
                const isRunningActivity = activitiesExpLogin.find((activity) => updatedData[activity].startingTime.length !== updatedData[activity].endingTime.length);
                if (isRunningActivity) {
                    return res.status(400).send({ error: `You can't perform any actions in ${isRunningActivity[0].toUpperCase() + isRunningActivity.slice(1)} when the punch-in timer is stopped.` })
                }
            }
            const updatedClockIn = await ClockIns.findByIdAndUpdate(req.params.id, updatedData, {
                new: true
            });
            let emp;
            // check has warning
            if (queryData?.warning) {
                emp = await Employee.findById(req.body.employee, "warnings").exec();
                if (!emp) {
                    console.log("error in update warnings for employee");
                    return res.status(404).send({ error: "Employee not found" })
                } else {
                    if (Number(emp.warnings)) {
                        emp.warnings = Number(emp.warnings) - 1;
                        await emp.save();
                    } else {
                        return res.status(400).send({ error: "warnings limit reached" })
                    }
                }
            }
            res.send({ updatedClockIn, isWarningLimitReached: (emp && emp?.warnings === 0) ? true : false });
        } else {
            return res.status(404).send({ message: "Clock-in entry not found" });
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.error("Error updating ClockIns:", error);
        res.status(500).send({ message: "Internal server error", details: error.message });
    }
});

router.put("/add-late-login/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const emp = await Employee.findById(req.params.id, "Email team FirstName LastName")
            .populate({
                path: "team", select: "hr",
                populate: { path: "hr", select: "FirstName LastName Email fcmToken" }
            });
        // check employee is exists
        if (!emp) {
            return res.status(404).send({ error: "employee data not found" })
        }
        // check employee in a team
        if (!emp.team) {
            return res.status(404).send({ error: "Your are not in any team" })
        }
        // trying to update data is exists
        const clockinData = await ClockIns.exists({ _id: req.body._id });
        if (!clockinData) {
            return res.status(400).send({ error: "clockins data not found" })
        }
        const updatedData = setTimeHolderForAllActivities(req.body);
        // check isAdded lateLogin data
        if (updatedData.lateLogin && Object.keys(updatedData.lateLogin).length > 0) {
            const updateClockins = await ClockIns.findByIdAndUpdate(req.body._id, updatedData, { new: true });
            // Send Email and Notification
            const { lateReason, lateType } = updateClockins.lateLogin;

            const subject = "Late Punch Submission Received";
            const hrEmails = emp.team.hr?.length > 0 ? emp.team.hr.map((user) => user.Email).filter((item) => Boolean(item)) : [];
            const hrFCMTokens = emp.team.hr?.length > 0 ? emp.team.hr.map((user) => user.fcmToken).filter((item) => Boolean(item)) : [];
            sendMail({
                From: `<${emp.Email}> (Nexshr)`,
                To: hrEmails.join(", "),
                Subject: subject,
                HtmlBody: `<html>
  <body>
    <h2>Late Punch Submission Received</h2>
    <p>
      This is to inform you that a late punch-in entry has been submitted for <strong>${getCurrentTimeInMinutes().toLocaleDateString()}</strong>.
      The employee has provided the following details:
    </p>
    <ul>
      <li><strong>Late Type:</strong> ${lateType}</li>
      <li><strong>Reason:</strong> ${lateReason}</li>
    </ul>
    <p>
      Please review the submitted reason and take appropriate action as per company policy.
      If the reason is valid and approved, no attendance deductions will be applied.
      If rejected, the system will automatically apply a half-day Loss of Pay (LOP).
    </p>
    <p>Kindly respond to the request at your earliest convenience through the HRM portal.</p>
    <p>Thank you.</p>
    <p>Regards,</p>
    <p>${emp.team.hr[0]?.FirstName}</p>
    <p>HR Department</p>
  </body>
</html>
`,
            });
            const path = `${process.env.FRONTEND_BASE_URL}/hr/attendance/late-punch`
            hrFCMTokens.forEach(async (token) => {
                await sendPushNotification({
                    token,
                    title: subject,
                    body: `${emp.FirstName} has submitted late login data. Kindly review and respond accordingly.`,
                    path
                });
            })

            return res.send({ message: "notified to hr successfully", notifiedFor: hrEmails })
        } else {
            return res.status(400).send({ error: "lateLogin data is required" })
        }
    } catch (error) {
        errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log("error add lateLogin data", error)
        return res.status(500).send({ error: error.message })
    }
})

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
            const officeStartAt = changeClientTimezoneDate(emp?.workingTimePattern?.StartingTime).toLocaleTimeString();
            const officeEndAt = changeClientTimezoneDate(emp?.workingTimePattern?.FinishingTime).toLocaleTimeString()
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
                <p>Please ensure that you log in on time at ${officeStartAt}.</p>
                <p>If you are delayed due to traffic or any unforeseen circumstances, please inform HR as soon as possible.</p>
            ` : `
                <p>Please ensure that you log out on time at ${officeEndAt}.</p>
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
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/remainder/:id/:timeOption", async (req, res) => {
    try {
        const { id, timeOption } = req.params;

        const emp = await Employee.findById(id, "FirstName LastName Email fcmToken company").populate("company");
        // send email notification
        const Subject = `${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended`;
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
            title: Subject,
            body: `Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended. Please resume your work.`,
            type: "late reason"
        });
        res.send({ message: "Sent mail to employee successfully." })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;
