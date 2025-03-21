const express = require("express");
const router = express.Router();
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHrNetworkAdmin, verifyTeamHigherAuthority } = require("../auth/authMiddleware");
const { clockInsValidation, ClockIns } = require("../models/ClockInsModel");
const { Employee } = require("../models/EmpModel");
const { getDayDifference } = require("./leave-app");
const sendMail = require("./mailSender");
const { LeaveApplication, LeaveApplicationValidation } = require("../models/LeaveAppModel");
const { Team } = require("../models/TeamModel");
const { getCurrentTimeInMinutes, formatTimeFromMinutes, timeToMinutes } = require("../Reuseable_functions/reusableFunction");

async function checkLoginForOfficeTime(scheduledTime, actualTime, permissionTime) {

    // Parse scheduled and actual time into hours and minutes
    const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
    const [actualHours, actualMinutes] = actualTime.split(':').map(Number);

    // Create Date objects for both scheduled and actual times
    const scheduledDate = new Date(2000, 0, 1, scheduledHours + (permissionTime || 0), scheduledMinutes);
    const actualDate = new Date(2000, 0, 1, actualHours, actualMinutes);

    // Calculate the difference in milliseconds
    const timeDifference = actualDate - scheduledDate;

    // Convert milliseconds to minutes
    const differenceInMinutes = Math.abs(Math.floor(timeDifference / (1000 * 60)));

    if (timeDifference > 0) {
        return `You came ${differenceInMinutes} minutes late today.`;
    } else if (timeDifference < 0) {
        return `You came ${differenceInMinutes} minutes early today.`;
    } else {
        return `You came on time today.`;
    }
}

// Function to calculate working hours between start and end times
function getTotalWorkingHourPerDay(startingTime, endingTime) {
    if (startingTime !== "00:00:00" && endingTime) {

        // Convert time strings to Date objects (using today's date)
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ...startingTime?.split(':').map(Number));
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ...endingTime?.split(':').map(Number));

        // Calculate the difference in milliseconds
        const startTime = start.getTime();
        const endTime = end.getTime();
        let timeDifference;
        if (endTime > startTime) {
            timeDifference = end - start;
        } else {
            timeDifference = start - end
        }

        // Convert the difference to minutes
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));

        return minutesDifference / 60;
    } else {
        return 0;
    }
}

router.post("/auto-permission/:patternId", async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        // Fetch employees who haven't logged in
        let notLoginEmps = await Employee.find({ workingTimePattern: req.params.patternId })
            .populate({
                path: "clockIns",
                match: { date: { $gte: startOfDay, $lt: endOfDay } }
            })
            .populate({
                path: "leaveApplication",
                match: {
                    fromDate: { $gte: startOfDay, $lt: endOfDay },
                    status: "approved"
                }
            })
            .populate("workingTimePattern");

        notLoginEmps = notLoginEmps.filter((emp) => emp?.clockIns?.length === 0 && emp?.leaveApplication.length === 0);

        // Process each employee sequentially
        for (const emp of notLoginEmps) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date();
            const empPermissions = await LeaveApplication.find({
                employee: emp._id,
                fromDate: { $gte: startOfMonth, $lt: endOfMonth },
                leaveType: "Permission Leave",
                status: "approved"
            });

            let halfDayLeaveApp;
            let subject, htmlContent;

            if (empPermissions.length === 2) {
                // Apply Half-day Leave
                halfDayLeaveApp = {
                    leaveType: "Unpaid Leave (LWP)",
                    fromDate: now,
                    toDate: new Date(now.getTime() + 4 * 60 * 60 * 1000),
                    periodOfLeave: "half day",
                    reasonForLeave: "Came too late",
                    employee: emp._id.toString(),
                    status: "approved",
                    TeamLead: "approved",
                    TeamHead: "approved",
                    Hr: "approved",
                    Manager: "approved"
                };

                subject = "Half-day Leave Applied (Unpaid Leave)";
                htmlContent = `
                    <html>
                        <body>
                            <h2>You have exceeded your permission limit.</h2>
                            <p>We are marking you on a half-day leave due to late arrival. Please adhere to the company's policies.</p>
                        </body>
                    </html>`;
            } else {
                // Apply Permission Leave
                const toDateTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours
                halfDayLeaveApp = {
                    leaveType: "Permission Leave",
                    fromDate: now,
                    toDate: toDateTime,
                    periodOfLeave: "half day",
                    reasonForLeave: "Came too late",
                    employee: emp._id.toString(),
                    status: "approved",
                    TeamLead: "approved",
                    TeamHead: "approved",
                    Hr: "approved",
                    Manager: "approved"
                };

                subject = empPermissions.length === 1 ? "2nd Permission Applied" : "1st Permission Applied";
                htmlContent = `
                    <html>
                        <body>
                            <h2>${empPermissions.length === 1 ? "Second" : "First"} permission applied.</h2>
                            <p>You have arrived late and have been granted a 2-hour permission. Ensure timely arrival.</p>
                        </body>
                    </html>`;
            }

            const { error } = LeaveApplicationValidation.validate(halfDayLeaveApp);
            if (error) {
                return res.status(400).send({ error: error.details[0].message });
            }

            // Save Leave Application
            const addLeave = await LeaveApplication.create(halfDayLeaveApp);
            emp.leaveApplication.push(addLeave._id);
            await emp.save();

            // Send Email Notification
            sendMail({
                From: process.env.FROM_MAIL,
                To: emp.Email,
                Subject: subject,
                HtmlBody: htmlContent,
            });
        }

        // Send response only once
        return res.send({ message: "Permission applied for late employees" });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
});

router.post("/not-login/apply-leave", async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        // Fetch employees who haven't logged in using aggregation for better performance
        let notLoginEmps = await Employee.aggregate([
            {
                $lookup: {
                    from: "clockins",
                    localField: "_id",
                    foreignField: "employee",
                    as: "clockIns",
                    pipeline: [{ $match: { date: { $gte: startOfDay, $lt: endOfDay } } }]
                }
            },
            { $match: { "clockIns.0": { $exists: false } } }, // Employees with no clock-ins
            {
                $lookup: {
                    from: "timepatterns",
                    localField: "workingTimePattern",
                    foreignField: "_id",
                    as: "workingTimePattern"
                }
            },
            { $unwind: { path: "$workingTimePattern", preserveNullAndEmptyArrays: true } }, // Preserve employees without a working pattern
            {
                $lookup: {
                    from: "leaveapplications",
                    localField: "leaveApplication",
                    foreignField: "_id",
                    as: "leaveApplications",
                    pipeline: [
                        {
                            $match: {
                                date: { $gte: startOfDay, $lt: endOfDay },
                                status: "approved"
                            }
                        }
                    ]
                }
            }
        ]);
        console.log(notLoginEmps[0]);

        if (notLoginEmps.length === 0) {
            return res.send({ message: "No employees found without punch-in today." });
        }

        const leaveApplications = [];
        const employeeUpdates = [];
        const emailPromises = [];

        for (const emp of notLoginEmps) {
            if (!emp.workingTimePattern) continue;// Skip employees without a working pattern

            // Remove any existing leave applications for the employee
            if (emp.leaveApplications.length > 0) {
                await LeaveApplication.deleteMany({ _id: { $in: emp.leaveApplications.map(leave => leave._id) } });
            }

            const workingHours = getTotalWorkingHourPerDay(
                emp.workingTimePattern.StartingTime,
                emp.workingTimePattern.FinishingTime
            );
            const fromDate = new Date(now.getTime() - (workingHours || 1000 * 60 * 60 * 9.30));
            console.log(fromDate);

            // Create new full-day leave application
            const leaveApplication = {
                leaveType: "Unpaid Leave (LWP)",
                fromDate,
                toDate: now,
                periodOfLeave: "full day",
                reasonForLeave: "Didn't punch in until EOD",
                employee: emp._id.toString(),
                status: "approved",
                TeamLead: "approved",
                TeamHead: "approved",
                Hr: "approved",
                Manager: "approved"
            };

            leaveApplications.push(leaveApplication);

            // Email notification
            const subject = "Full-day Leave Applied (Unpaid Leave)";
            const htmlContent = `
                <html>
                    <body>
                        <h2>You didn't punch in on HRM until the end of the day.</h2>
                        <p>As a result, we are marking you as on full-day leave, which will be deducted from your salary. Please adhere to the company's policies.</p>
                    </body>
                </html>`;

            emailPromises.push(sendMail({
                From: process.env.FROM_MAIL,
                To: emp.Email,
                Subject: subject,
                HtmlBody: htmlContent,
            }));
        }

        // Insert new leave applications in bulk

        const insertedLeaves = await LeaveApplication.insertMany(leaveApplications);

        // Prepare employee updates for bulk write
        // notLoginEmps.forEach((emp, index) => {
        //     employeeUpdates.push({
        //         updateOne: {
        //             filter: { _id: emp._id },
        //             update: { $set: { leaveApplication: [insertedLeaves[index]._id] } }
        //         }
        //     });
        // });

        // Perform bulk update on employees
        if (employeeUpdates.length > 0) {
            await Employee.bulkWrite(employeeUpdates);
        }

        // Send all emails in parallel
        await Promise.all(emailPromises);

        res.send({ message: "Full-day leave applied and emails sent for employees who didn't punch in." });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: error.message });
    }
});

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // const { worklocation, placeId } = req.query;
        // console.log(worklocation, placeId);

        let regular = 0, late = 0, early = 0;
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
        // if (!worklocation || !placeId) {
        //     return res.status(400).send({ error: "Please select your work location" })
        // }
        // Fetch employee details with required fields
        const emp = await Employee.findById(req.params.id)
            .populate("workingTimePattern")
            .populate("company")
            .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
            .populate({
                path: "leaveApplication",
                match: { fromDate: { $gte: startOfDay, $lte: endOfDay }, status: "approved", leaveType: "Permission Leave" }
            })

        if (!emp) return res.status(404).send({ error: "Employee not found!" });
        if (emp?.clockIns?.length > 0) return res.status(409).send({ message: "You have already Punch-In!" });

        //verify emp is in office
        // if (worklocation === "WFO") {
        //     if (emp.company.placeId !== placeId) {
        //         return res.status(400).send({ error: "Please start the timer when you arrive at the office" })
        //     }
        // }
        // Office login time & employee login time
        const officeLoginTime = emp?.workingTimePattern?.StartingTime || "9:00";
        const loginTimeRaw = req.body?.login?.startingTime?.[0];
        if (!loginTimeRaw) return res.status(400).send({ error: "You must start Punch-in Timer" });

        // Function to convert time to minutes
        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Handle permission leave & apply half-day leave if exceeded
        if (emp?.leaveApplication.length > 0) {
            const leave = emp.leaveApplication[0];
            const totalPermissionMinutes = (new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / 60000;
            const companyLoginMinutes = timeToMinutes(officeLoginTime);
            const empLoginMinutes = timeToMinutes(loginTimeRaw);

            if (companyLoginMinutes + totalPermissionMinutes < empLoginMinutes) {
                const halfDayLeaveApp = {
                    leaveType: "Unpaid Leave (LWP)",
                    fromDate: today,
                    toDate: today,
                    periodOfLeave: "half day",
                    reasonForLeave: "Came too late",
                    prescription: "",
                    employee: emp._id,
                    coverBy: null,
                    status: "approved",
                    TeamLead: "approved",
                    TeamHead: "approved",
                    Hr: "approved",
                    approvedOn: null,
                    approverId: []
                };
                const deletePermission = await LeaveApplication.findByIdAndDelete(leave._id);
                const removedPermissionLeaves = emp.leaveApplication.filter((leave) => leave !== leave._id)
                emp.leaveApplication = removedPermissionLeaves;
                const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                emp.leaveApplication.push(addLeave._id);
                await emp.save();

                // Send email notification
                const htmlContent = `
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                            .content { margin: 20px 0; }
                            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="content">
                                <h2 class="center_text">You arrived much later than your permitted time.</h2>
                                <p>
                                    As a result, a half-day leave has been applied.  
                                    Moving forward, please ensure you arrive on time by **${emp.workingTimePattern.StartingTime}**.  
                                    Kindly adhere to company policies.  
                                    **Thank you!**
                                </p>
                            </div>
                            <div class="footer">
                                <p>Need help? <a href="mailto:webnexs29@gmail.com">Contact our support team</a>.</p>
                            </div>
                        </div>
                    </body>
                </html>`;

                sendMail({
                    From: process.env.FROM_MAIL,
                    To: emp.Email,
                    Subject: `Half-day Leave Applied (Unpaid Leave - LWP)`,
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
        const permissionMinutes = emp?.leaveApplication?.length
            ? ((new Date(emp.leaveApplication[0].toDate).getTime() - new Date(emp.leaveApplication[0].fromDate).getTime()) / 60000) / 60
            : 0;

        const behaviour = checkLoginStatus(officeLoginTime, loginTime, permissionMinutes);
        const punchInMsg = await checkLoginForOfficeTime(officeLoginTime, loginTime, permissionMinutes);

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
    // Helper function to convert time in HH:MM:SS format to total minutes
    try {
        const queryDate = new Date(req.query.date);

        // Create start and end of the day in UTC
        const startOfDay = new Date(Date.UTC(
            queryDate.getUTCFullYear(),
            queryDate.getUTCMonth(),
            queryDate.getUTCDate(),
            0, 0, 0, 0
        ));

        const endOfDay = new Date(Date.UTC(
            queryDate.getUTCFullYear(),
            queryDate.getUTCMonth(),
            queryDate.getUTCDate(),
            23, 59, 59, 999
        ));

        // Fetch employee's clock-ins for the given date
        const timeData = await Employee.findById(req.params.id)
            .populate({
                path: "clockIns",
                match: {
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay,
                    },
                },
                populate: { path: "employee", select: "_id FirstName LastName" },
            });

        if (!timeData || timeData.clockIns.length === 0) {
            return res.status(200).send({ status: false, message: "No clock-ins found for the given date." });
        }


        // Define activities and calculate times
        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
        const clockIn = timeData.clockIns[0]; // Assuming the first clock-in for the day

        activities.map((activity) => {
            let startingTimes = clockIn[activity]?.startingTime;
            let endingTimes = clockIn[activity]?.endingTime;

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

            const totalValue = values?.reduce((acc, value) => acc + value, 0)
            const timeHolder = formatTimeFromMinutes(totalValue);
            clockIn[activity].timeHolder = timeHolder;
        })

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
        });

        // Calculate total working minutes
        const totalEmpWorkingMinutes = activitiesData.reduce((total, activity) => total + activity.timeCalMins, 0);

        // Convert total minutes to hours and minutes
        const hours = Math.floor(totalEmpWorkingMinutes / 60);
        const minutes = totalEmpWorkingMinutes % 60;
        // Respond with calculated data
        return res.send({
            timeData,
            activitiesData,
            empTotalWorkingHours: (hours + minutes / 60).toFixed(2), // Rounded to 2 decimal places
        });

    } catch (err) {
        console.error(err);
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
        const [endHour, endMin] = end.split(":").map(Number);
        const [startHour, startMin] = start.split(":").map(Number);

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
    const now = new Date();
    const { empId } = req.params;
    let totalEmpWorkingHours = 0;
    let totalLeaveDays = 0;
    let regular = 0, late = 0, early = 0;

    const [startOfMonth, endOfMonth] = req.query.daterangeValue
        ? [new Date(req.query.daterangeValue[0]), new Date(req.query.daterangeValue[1])]
        : [
            new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)),
            new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
        ];

    const checkLogin = (scheduledTime, actualTime) => {
        const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
        const [actualHours, actualMinutes] = actualTime.split(':').map(Number);

        const scheduledDate = new Date(2000, 0, 1, schedHours, schedMinutes);
        const actualDate = new Date(2000, 0, 1, actualHours, actualMinutes);

        if (actualDate > scheduledDate) {
            late++;
            return "Late";
        } else if (actualDate < scheduledDate) {
            early++;
            return "Early";
        } else {
            regular++;
            return "On Time";
        }
    };

    const getTotalWorkingHoursExcludingWeekends = (start, end, dailyHours = 8) => {
        let totalHours = 0;
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclude weekends
                totalHours += dailyHours;
            }
        }
        return totalHours;
    };

    try {
        const employee = await Employee.findById(empId, "_id FirstName LastName clockIns leaveApplication")
            .populate({
                path: "clockIns",
                match: { date: { $gte: startOfMonth, $lte: endOfMonth } },
                populate: { path: "employee", select: "FirstName LastName" }
            })
            .populate({
                path: "leaveApplication",
                match: {
                    fromDate: { $gte: startOfMonth, $lte: endOfMonth },
                    toDate: { $gte: startOfMonth, $lte: endOfMonth },
                    status: "approved"
                }
            });

        if (!employee) return res.status(400).send({ message: "Employee not found." });

        totalLeaveDays = employee.leaveApplication.reduce((sum, leave) => sum + getDayDifference(leave), 0);

        employee.clockIns.forEach(({ login }) => {
            const { startingTime, endingTime } = login;
            totalEmpWorkingHours += getTotalWorkingHourPerDay(startingTime[0], endingTime[endingTime.length - 1]);
            checkLogin("09:00", startingTime[0]);
        });

        const companyWorkingHours = getTotalWorkingHoursExcludingWeekends(startOfMonth, endOfMonth);
        const totalWorkingHoursPerMonth = getTotalWorkingHoursExcludingWeekends(startOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0));

        res.send({
            totalRegularLogins: regular,
            totalLateLogins: late,
            totalEarlyLogins: early,
            companyWorkingHours,
            totalWorkingHoursPerMonth,
            totalEmpWorkingHours: totalEmpWorkingHours.toFixed(2),
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
        const emp = await Employee.findById(req.params.id).populate({
            path: "clockIns",
            match: { _id: req.params.clockinId }
        }).exec()

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

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NexsHR</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f6f9fc;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 16px;
              text-align: left;
              background-color: #fff;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .table th, .table td {
              padding: 12px 15px;
              border: 1px solid #ddd;
            }
            .table th {
              background-color: #4CAF50;
              color: white;
              font-weight: bold;
              text-transform: uppercase;
            }
            .table tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            .table tr:hover {
              background-color: #e9f4f1;
            }
            .row {
              display: flex;
              justify-content: center;
              margin: 20px;
            }
            .col-lg-6, .col-md-6, .col-12 {
              flex: 1;
              max-width: 80%;
              margin: 0 auto;
            }
            p {
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="row">
            <div class="col-lg-6 col-md-6 col-12">
              <p>Hi ${emp.FirstName},</p>
              <p>Your timing details for today are here:</p>
              <table class="table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Starting Time</th>
                    <th>Ending Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${activitiesData && activitiesData.length > 0
                ? activitiesData
                    .map(
                        (data) => `
                              <tr>
                                <td>${data.activity}</td>
                                <td>${data.startingTime}</td>
                                <td>${data.endingTime}</td>
                              </tr>
                            `
                    )
                    .join("")
                : `<tr><td colspan="3" style="text-align: center;">No activity data available</td></tr>`
            }
                </tbody>
              </table>
              <p>Happy working!</p>
            </div>
          </div>
        </body>
        </html>
      `;

        sendMail({
            From: process.env.FROM_MAIL,
            To: emp.Email,
            Subject: `You have punched in for the Today`,
            HtmlBody: htmlContent,
        });
        return res.send({ message: "We have send mail for you have completed 8 working hours." })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHrNetworkAdmin, async (req, res) => {
    try {
        let attendanceData = await ClockIns.find()
            .populate({ path: "employee", select: "FirstName LastName" })
            .sort({ date: -1 });

        res.send(attendanceData);
    } catch (error) {
        console.error("Error fetching attendance data:", error);
        res.status(500).send({ message: error.message })
    }
})

router.put("/:id", verifyAdminHREmployeeManagerNetwork, (req, res) => {
    let body = req.body;

    ClockIns.findByIdAndUpdate(req.params.id, body, {
        new: true
    }, (err, data) => {
        if (err) {
            res.status(500).send({ message: "Internal server Error", details: err.details })
        } else {
            delete data._id;
            res.send(data);
        }
    })
})

router.post("/ontime/:type", async (req, res) => {
    try {
        const date = new Date();
        const hour = date.getHours();
        const min = date.getMinutes();
        const { type } = req.params;

        const emps = await Employee.find({}, "FirstName LastName Email")
            .populate("company")
            .populate({ path: "workingTimePattern" });

        const activeEmps = emps.filter((emp) => {
            if (type === "login") {
                return emp?.workingTimePattern?.StartingTime == `${hour}:${min}`
            } else {
                return emp?.workingTimePattern?.FinishingTime == `${hour}:${min}`
            }
        })

        activeEmps.map((emp) => {
            sendMail({
                From: process.env.FROM_MAIL,
                To: emp.Email,
                Subject: type === "login" ? "Login Remainder" : "Logout Remainder",
                HtmlBody: `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${emp?.company?.CompanyName}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f6f9fc;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .content {
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    font-size: 14px;
                    margin-top: 20px;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <p>Dear ${emp.FirstName} ${emp.LastName},</p>
                    ${type === "login" ?
                        `
                                <p>Please ensure that you log in on time at ${emp?.workingTimePattern?.StartingTime}.</p>
                                <p>If you are delayed due to traffic or any unforeseen circumstances, please inform HR as soon as possible.</p>
                                ` :
                        `<p>Please ensure that you log out on time at ${emp?.workingTimePattern?.FinishingTime}.</p>`
                    }
                    <p>Kindly follow the necessary guidelines.</p><br />
                    <p>Thank you!</p>
                </div>
                <div class="footer">
                    <p>Have questions or need assistance? <a href="mailto:${process.env.FROM_MAIL}">Contact ${process.env.FROM_MAIL}</a>.</p>
                </div>
            </div>
        </body>
        </html>
        `
            })
        })
        console.log("sent successfully!");

        return res.send({ message: "Email sent successfully for all employees." })

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/remainder/:id/:timeOption", async (req, res) => {
    try {
        const { id, timeOption } = req.params;

        const emp = await Employee.findById({ _id: id }).populate("company");
        sendMail({
            From: process.env.FROM_MAIL,
            To: emp.Email,
            Subject: `Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended`,
            HtmlBody: `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${emp.company.CompanyName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f6f9fc;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .content {
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        margin-top: 20px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <p>Dear ${emp.FirstName} ${emp.LastName},</p>
                        <p>Your ${timeOption[0].toUpperCase() + timeOption.slice(1)} time has ended. Please resume your work.</p>
                        <p>If you encounter any issues, please contact HR.</p>
                        <p>Kindly adhere to the necessary guidelines.</p><br />
                        <p>Thank you!</p>
                    </div>
                    <div class="footer">
                        <p>Have questions or need assistance? <a href="mailto:${process.env.FROM_MAIL}">Contact us</a>.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        });
        res.send({ message: "Sent mail to employee successfully." })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})


module.exports = router;
