const express = require("express");
const router = express.Router();
const { verifyAdminHREmployee, verifyAdminHR } = require("../auth/authMiddleware");
const { clockInsValidation, ClockIns } = require("../models/ClockInsModel");
const { Employee } = require("../models/EmpModel");
const { getDayDifference } = require("./leave-app");
const sendMail = require("./mailSender");

function timeToMinutes(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return Number(((hours * 60) + minutes + (seconds / 60)).toFixed(2)) || 0; // Defaults to 0 if input is invalid
}

async function checkLoginForOfficeTime(scheduledTime, actualTime) {
    // Parse scheduled and actual time into hours and minutes
    const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
    const [actualHours, actualMinutes] = actualTime.split(':').map(Number);

    // Create Date objects for both scheduled and actual times
    const scheduledDate = new Date(2000, 0, 1, scheduledHours, scheduledMinutes);
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

function formatTimeFromMinutes(minutes) {
    const hours = Math.floor(minutes / 60); // Get the number of hours
    const mins = Math.floor(minutes % 60); // Get the remaining whole minutes
    const fractionalPart = minutes % 1; // Get the fractional part of the minutes
    const secs = Math.round(fractionalPart * 60); // Convert the fractional part to seconds

    // Format each part to ensure two digits (e.g., "04" instead of "4")
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(mins).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

router.post("/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        let regular = 0, late = 0, early = 0;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Fetch employee details
        const emp = await Employee.findById(req.params.id)
            .populate("workingTimePattern")
            .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } });
        console.log(emp);

        if (!emp) {
            return res.status(404).send({ error: "Employee not found!" });
        }

        if (emp?.clockIns?.length > 0) {
            return res.status(409).send({ message: "You have already Punch-In!" });
        }

        // Validate input data
        const { error } = clockInsValidation.validate(req.body);
        if (error) return res.status(400).send({ message: error.message });

        // Extract and validate login time
        const loginTimeRaw = req.body?.login?.startingTime?.[0];
        if (!loginTimeRaw) {
            return res.status(400).send({ error: "You must start Punch-in Timer" });
        }

        // Function to check login status
        const checkLogin = (scheduledTime, actualTime) => {
            if (!scheduledTime || !actualTime) return null;

            const [schH, schM] = scheduledTime.split(':').map(Number);
            const [actH, actM] = actualTime.split(':').map(Number);
            const scheduledDate = new Date(2000, 0, 1, schH, schM);
            const actualDate = new Date(2000, 0, 1, actH, actM);

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

        // Determine login behavior
        const officeLoginTime = emp?.workingTimePattern?.StartingTime || "9:00";
        // console.log(officeLoginTime);

        const [hour, minute] = loginTimeRaw.split(":");
        const loginTime = `${hour}:${minute}`;
        // console.log("Office Login Time:", officeLoginTime);

        // Synchronous check for behaviour
        const behaviour = checkLogin(officeLoginTime, loginTime);

        // Async check for punch-in message
        const punchInMsg = await checkLoginForOfficeTime(officeLoginTime, loginTime);

        // // Ensure values are properly assigned
        // console.log("Behaviour:", behaviour);
        // console.log("Punch-In Message:", punchInMsg);

        // Create clock-in entry
        const newClockIns = await ClockIns.create({
            ...req.body,
            behaviour: behaviour,  // Ensure it's explicitly assigned
            punchInMsg: punchInMsg,  // Ensure it's explicitly assigned
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

router.get("/:id", verifyAdminHREmployee, async (req, res) => {
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
            return res.status(404).send({ message: "No clock-ins found for the given date." });
        }
        console.log(timeData);


        // Define activities and calculate times
        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
        const clockIn = timeData.clockIns[0]; // Assuming the first clock-in for the day

        activities.map((activity) => {
            let startingTimes = clockIn[activity]?.startingTime;
            let endingTimes = clockIn[activity]?.endingTime;

            const getCurrentTimeInMinutes = () => {
                const now = new Date().toLocaleTimeString('en-US', { timeZone: process.env.TIMEZONE, hourCycle: 'h23' });
                const timeWithoutSuffix = now.replace(/ AM| PM/, ""); // Remove AM/PM
                const [hour, min, sec] = timeWithoutSuffix.split(":").map(Number);
                return timeToMinutes(`${hour}:${min}:${sec}`);
            };


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

router.get("/item/:id", verifyAdminHREmployee, async (req, res) => {
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
router.get("/employee/:empId", verifyAdminHREmployee, async (req, res) => {
    const emp = await Employee.findById({ _id: req.params.empId }).exec();

    let totalEmpWorkingHours = 0; // Track total working hours for the employee
    let totalLeaveDays = 0;

    const now = new Date();
    let startOfMonth;
    let endOfMonth;
    if (req?.query?.daterangeValue) {
        startOfMonth = new Date(req.query.daterangeValue[0]);
        endOfMonth = new Date(req.query.daterangeValue[1]);
    } else {
        startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const joiningDate = new Date(emp.dateOfJoining);
        if (startOfMonth.getTime() < joiningDate.getTime()) {
            startOfMonth = joiningDate;
        }
        endOfMonth = new Date();
    }

    let regular = 0;
    let late = 0;
    let early = 0;
    // Function to check login times and update status counts
    async function checkLogin(scheduledTime, actualTime) {
        const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
        const [actualHours, actualMinutes] = actualTime.split(':').map(Number);

        const scheduledDate = new Date(2000, 0, 1, scheduledHours, scheduledMinutes);
        const actualDate = new Date(2000, 0, 1, actualHours, actualMinutes);

        if (actualDate > scheduledDate) {
            late += 1;
            return "Late";
        } else if (actualDate < scheduledDate) {
            early += 1;
            return "Early";
        } else {
            regular += 1;
            return "On Time";
        }
    }

    // Function to calculate total working hours excluding weekends
    async function getTotalWorkingHoursExcludingWeekends(startDate, endDate, dailyHours = 8) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let totalWorkingHours = 0;

        // Iterate through each date in the range
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends (Sundays and Saturdays)
                totalWorkingHours += dailyHours;
            }
        }

        return totalWorkingHours;
    }

    try {
        const employee = await Employee.findById(req.params.empId, "_id FirstName LastName clockIns leaveApplication")
            .populate({
                path: "clockIns",
                match: {
                    date: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    }
                },
                populate: {
                    path: "employee", // Ensure this matches the defined model name
                    select: "_id FirstName LastName"
                }
            })
            .populate({
                path: "leaveApplication",
                match: {
                    fromDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    toDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    status: "approved"
                }
            });


        if (!employee) {
            return res.status(400).send({ message: "No Employee found with given ID" });
        }

        // Calculate company's total working hours per month excluding weekends
        const companyTotalWorkingHour = await getTotalWorkingHoursExcludingWeekends(
            startOfMonth,
            endOfMonth
        );
        const totalWorkingHoursPerMonth = await getTotalWorkingHoursExcludingWeekends(
            startOfMonth,
            new Date(now.getFullYear(), now.getMonth() + 1, 0)
        )

        //get lastMonth of leave days
        employee.leaveApplication.forEach((leave) => {
            totalLeaveDays += getDayDifference(leave)
        })

        // Process employee clock-in data
        employee.clockIns.forEach(async (clockIn) => {
            const { startingTime, endingTime } = clockIn.login;

            // Calculate total working hours for this employee clock-in
            const workingHours = getTotalWorkingHourPerDay(startingTime[0], endingTime[endingTime.length - 1]);

            totalEmpWorkingHours += workingHours;

            // Compare with scheduled time (assumed to be "09:00")
            await checkLogin("09:00", startingTime[0]);
        });

        // Return the response with collected data
        res.send({
            totalRegularLogins: regular,
            totalLateLogins: late,
            totalEarlyLogins: early,
            companyTotalWorkingHour,
            totalWorkingHoursPerMonth,
            totalEmpWorkingHours: totalEmpWorkingHours.toFixed(2),// Return total working hours for the employee
            totalLeaveDays,
            clockIns: employee.clockIns
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error", details: error.message });
    }
});

router.get("/sendmail/:id/:clockinId", verifyAdminHREmployee, async (req, res) => {
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
                         padding: 0;
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
                     </style>
                   </head>
                   <body>
                     <div class="row">
                        <div class="col-lg-6 col-md-6 col-12">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Activity</th>
                                        <th>Starting Time</th>
                                        <th>Ending Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${activitiesData?.map((data, index) => `
                                          <tr key="${index}">
                                              <td>${data.activity}</td>
                                              <td>${data.startingTime}</td>
                                              <td>${data.endingTime}</td>
                                          </tr>
                                      `).join('')
            }
                                </tbody>
                            </table>
                        </div>
                    </div>
                   </body>
                   </html>
                 `;

        sendMail({
            From: process.env.FROM_MAIL,
            To: emp.Email,
            Subject: "You have completed 8 of Today working hours",
            HtmlBody: htmlContent,
        });
        return res.send({ message: "We have send mail for you have completed 8 working hours." })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/", verifyAdminHR, async (req, res) => {
    try {
        const attendanceData = await ClockIns.find({}).populate({ path: "employee", select: "FirstName LastName" });
        res.send(attendanceData);
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.put("/:id", verifyAdminHREmployee, (req, res) => {
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

module.exports = router;
