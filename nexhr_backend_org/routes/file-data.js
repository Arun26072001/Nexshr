const express = require("express");
const { verifyAdminHR, verifyAdminHrNetworkAdmin } = require("../auth/authMiddleware");
const router = express.Router();
const XLSX = require("xlsx");
const { upload } = require("./imgUpload");
const fs = require("fs");
const sendMail = require("./mailSender");
const { Employee } = require("../models/EmpModel");
const { ClockIns } = require("../models/ClockInsModel");
const { LeaveApplication, LeaveApplicationValidation } = require("../models/LeaveAppModel");

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
};

// Upload and process attendance file
router.post("/attendance", upload.single("documents"), verifyAdminHrNetworkAdmin,
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ status: false, message: "No file uploaded." });
        }

        const filePath = req.file.path;
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            let records = [];
            for (let i = 1; i < excelData.length; i++) {
                const row = excelData[i];
                if (!row || !row[6]) continue;

                const punchInRecords = row[6].split(",");
                if (punchInRecords.length > 1) {
                    let totalHours = 0;
                    for (let j = 0; j < punchInRecords.length - 1; j++) {
                        const inMinutes = timeToMinutes(punchInRecords[j]);
                        const outMinutes = timeToMinutes(punchInRecords[j + 1]);
                        if (outMinutes > inMinutes) totalHours += (outMinutes - inMinutes) / 60;
                    }

                    records.push({
                        empCode: row[0],
                        empName: row[1],
                        PunchIn: punchInRecords[0],
                        totalHours: totalHours.toFixed(2),
                        punchInRecords,
                        PunchOut: punchInRecords[punchInRecords.length - 1],
                    });
                }
            }

            fs.unlinkSync(filePath); // Delete file after processing

            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            for (const record of records) {
                const emp = await Employee.findOne({ code: record.empCode })
                    .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
                    .populate({ path: "leaveApplication", match: { fromDate: { $gte: startOfDay, $lte: endOfDay }, status: "approved" } })
                    .populate({ path: "workingTimePattern" })
                    .exec();

                if (!emp) continue;

                const companyPunchInTime = timeToMinutes(emp.workingTimePattern?.StartingTime);
                const empPunchInTime = timeToMinutes(record.PunchIn);

                if (companyPunchInTime < empPunchInTime) {
                    const permission = emp.leaveApplication[0];
                    if (permission) {
                        const fromHour = timeToMinutes(permission.fromDate.split(" ")[1]);
                        const toHour = timeToMinutes(permission.toDate.split(" ")[1]);
                        const totalPermissionHour = toHour - fromHour;

                        if ((companyPunchInTime + totalPermissionHour) < empPunchInTime) {
                            const halfDayLeaveApp = {
                                leaveType: "Unpaid Leave (LWP)",
                                fromDate: today,
                                toDate: today,
                                periodOfLeave: "half day",
                                reasonForLeave: "Came too late",
                                prescription: "",
                                employee: emp._id,
                                coverBy: "",
                                status: "rejected",
                                TeamLead: "rejected",
                                TeamHead: "rejected",
                                Hr: "rejected",
                                approvedOn: null,
                                approverId: []
                            };
                            const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                            emp.leaveApplication.push(addLeave._id);
                            await emp.save();

                            // send mail To employee
                            const htmlContent = `
                            <html>
                                <head>
                                    <style>
                                        body {font - family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                                        .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                                        .content {margin: 20px 0; }
                                        .footer {text - align: center; font-size: 14px; margin-top: 20px; color: #777; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="content">
                                            <h2 class="center_text">You came much later than your permitted time.</h2>
                                            <p>
                                                So, we are marking you as taking a half-day leave.
                                                Hereafter, please come early or by (${emp.workingTimePattern.StartingTime}).
                                                Please follow the company instructions.
                                                Thank you!
                                            </p>
                                        </div>

                                        <div class="footer">
                                            <p>Have questions? Need help? <a href="mailto:webnexs29@gmail.com">Contact our support team</a>.</p>
                                        </div>
                                    </div>
                                </body>
                            </html>`
                            sendMail({
                                From: process.env.FROM_MAIL,
                                To: emp.Email,
                                Subject: `Half-day Leave Applied(Unpaid Leave (LWP))`,
                                HtmlBody: htmlContent,
                            })
                            continue;
                        }
                    } else {
                        try {
                            const halfDayLeaveApp = {
                                leaveType: "Unpaid Leave (LWP)",
                                fromDate: today,
                                toDate: today,
                                periodOfLeave: "half day",
                                reasonForLeave: "Came To late",
                                prescription: "",
                                employee: emp._id.toString(),
                                coverBy: null,
                                status: "rejected",
                                TeamLead: "rejected",
                                TeamHead: "rejected",
                                Hr: "rejected",
                            };
                            const { error } = LeaveApplicationValidation.validate(halfDayLeaveApp);
                            if (error) {
                                return res.status(400).send({ error: error.details[0].message })
                            }
                            const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                            emp.leaveApplication.push(addLeave._id);
                            await emp.save();

                            const htmlContent = `
                            <html>
                                <head>
                                    <style>
                                        body {font - family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                                        .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                                        .content {margin: 20px 0; }
                                        .footer {text - align: center; font-size: 14px; margin-top: 20px; color: #777; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="content">
                                            <h2 class="center_text">You came much later than your permitted time.</h2>
                                            <p>
                                                So, we are marking you as taking a half-day leave.
                                                Hereafter, please come early or by (${emp.workingTimePattern.StartingTime}).
                                                Please follow the company instructions.
                                                Thank you!
                                            </p>
                                        </div>
    
                                        <div class="footer">
                                            <p>Have questions? Need help? <a href="mailto:${process.env.FROM_MAIL}">Contact our support team</a>.</p>
                                        </div>
                                    </div>
                                </body>
                            </html>`
                            sendMail({
                                From: process.env.FROM_MAIL,
                                To: emp.Email,
                                Subject: `Half-day Leave Applied(Unpaid Leave (LWP))`,
                                HtmlBody: htmlContent,
                            })
                            continue;
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }

                if (Number(record.totalHours) < 8) {
                    const clockIn = emp.clockIns[0];
                    if (clockIn) {
                        const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
                        const activitiesData = activities.map((activity) => ({
                            activity,
                            startingTime: clockIn?.[activity]?.startingTime?.[0] || "00:00",
                            endingTime: clockIn?.[activity]?.endingTime?.slice(-1)[0] || "00:00",
                        }));

                        await ClockIns.findByIdAndUpdate(clockIn._id, { ...clockIn, machineRecords: record.punchInRecords });

                        const emailHtml = `
                        <html>
                        <head>
                          <style>
                            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                            .table { width: 100%; border-collapse: collapse; font-size: 16px; background-color: #fff; }
                            .table th, .table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
                            .table th { background-color: #4CAF50; color: white; text-transform: uppercase; }
                            .table tr:nth-child(even) { background-color: #f2f2f2; }
                            .table tr:hover { background-color: #e9f4f1; }
                            .center_text { text-align: center; margin: 20px 0; }
                          </style>
                        </head>
                        <body>
                          <h2 class="center_text">Total Working Hours - ${record.totalHours} (Machine Recorded)</h2>
                          <table class="table">
                              <thead>
                                  <tr>
                                      <th>Activity</th>
                                      <th>Starting Time</th>
                                      <th>Ending Time</th>
                                      <th>Machine Records</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${activitiesData.map((data, index) => `
                                      <tr>
                                          <td>${data.activity[0].toUpperCase() + data.activity.slice(1)}</td>
                                          <td>${data.startingTime}</td>
                                          <td>${data.endingTime}</td>
                                          <td>${record.punchInRecords[index] || "00:00"} - ${record.punchInRecords[index + 1] || "00:00"}</td>
                                      </tr>
                                  `).join("")}
                              </tbody>
                          </table>
                        </body>
                        </html>
                    `;

                        sendMail({
                            From: process.env.FROM_MAIL,
                            To: emp.Email,
                            Subject: "Incomplete Working Hours Alert",
                            HtmlBody: emailHtml,
                            TextBody: "Your working hours are incomplete. Please review your schedule."
                        });
                    }
                }
            }

            res.status(200).json({ status: true, message: "File processed successfully!", data: records });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, error: error.message || "An error occurred during the bulk import process." });
        } finally {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    });

router.post("/employees", upload.single("documents"), verifyAdminHR, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: "No file uploaded." });
    }

    const filePath = req.file.path;
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Convert to JSON while trimming empty rows
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 }).filter(row => row.some(cell => cell !== null && cell !== ""));


        let employees = [];
        let existsEmps = [];
        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            console.log(row);

            const employeeExists = await Employee.exists({ code: row[9] });
            if (!employeeExists && row[0]?.trim()) {
                const newEmp = {
                    FirstName: row[0],
                    LastName: row[1],
                    Email: row[2],
                    Password: row[3],
                    countryCode: row[4],
                    phone: row[5],
                    panNumber: row[6],
                    dateOfBirth: row[7],
                    gender: row[8],
                    code: row[9],
                    working: row[10],
                    dateOfJoining: row[11],
                    employmentType: row[12],
                    description: row[13],
                    bloodGroup: row[14],
                    annualLeaveEntitlement: 14,
                    typesOfLeaveCount: {
                        "Annual Leave": "7",
                        "Sick Leave": "7",
                        "permission": "2"
                    },

                    typesOfLeaveRemainingDays: {
                        "Annual Leave": "7",
                        "Sick Leave": "7"
                    },
                    role: "679b31dba453436edb1b27a3",
                    workingTimePattern: "679ca37c9ac5c938538f18ba",
                    emergencyContacts: row[15] ? [{
                        name: row[15]?.split(" ")[0] || "",
                        phone: row[15]?.split(" ")[1] || ""
                    }] : []
                };

                employees.push(newEmp);
                try {
                    const addEmp = await Employee.create(newEmp);
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>NexsHR</title>
                          <style>
                            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; }
                            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                            .header { text-align: center; padding: 20px; }
                            .header img { max-width: 100px; }
                            .content { margin: 20px 0; }
                            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
                            .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="header">
                              <img src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public" alt="Logo" />
                              <h1>Welcome To NexsHR</h1>
                            </div>
                            <div class="content">
                              <p>Hey ${addEmp.FirstName} ${addEmp.LastName} 👋,</p>
                              <p><b>Your credentials</b></p><br />
                              <p><b>Email</b>: ${addEmp.Email}</p><br />
                              <p><b>Password</b>: ${addEmp.Password}</p><br />
                              <p>Your details have been registered! Please confirm your email by clicking the button below.</p>
                              <a href="${process.env.FRONTEND_URL}" class="button">Confirm Email</a>
                            </div>
                            <div class="footer">
                              <p>Have questions? Need help? <a href="mailto:webnexs29@gmail.com">Contact our support team</a>.</p>
                            </div>
                          </div>
                        </body>
                        </html>`;

                    sendMail({
                        From: process.env.FROM_MAIL,
                        To: addEmp.Email,
                        Subject: "Welcome To NexsHR",
                        HtmlBody: htmlContent,
                    });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ error: error.message });
                }
            } else if (employeeExists) {
                existsEmps.push(row);
            }
        }

        fs.unlinkSync(filePath);
        res.status(200).json({ status: true, message: `File processed successfully and ${employees.length} added, ${existsEmps.length} Exists!`, data: employees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: error.message || "An error occurred during the bulk import process." });
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});

router.post("/leave", upload.single("documents"), verifyAdminHR, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: "No file uploaded." });
    }

    const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    const filePath = req.file.path;
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[1]; // Get second sheet
        const sheet = workbook.Sheets[sheetName];

        if (!sheetName) {
            throw new Error("Sheet not found!");
        }

        const monthNumber = months.findIndex(m => m === sheetName.toLowerCase());
        if (monthNumber === -1) {
            throw new Error("Invalid month detected in sheet name!");
        }

        // Convert to JSON while trimming empty rows
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 0 });

        let emps = [];

        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            let leaveAppDates = [];

            const today = new Date();
            today.setMonth(monthNumber);

            Object.entries(row).forEach(([key, value]) => {
                if (!isNaN(Number(key))) { // Check if key is a number (date column)
                    const name = row["__EMPTY_1"]; // Assuming employee name is in this column

                    const newLeaveData = {
                        name,
                        date: new Date(today.setDate(Number(key))), // Set correct date
                        status: value
                    };

                    leaveAppDates.push(newLeaveData);
                }
            });

            emps.push(...leaveAppDates);
        }
        console.log(emps);

        res.status(200).json({ status: true, message: `${emps.length} employees' leave data added.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message || "An error occurred during the bulk import process."
        });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Ensure the uploaded file is deleted
        }
    }
});


module.exports = router