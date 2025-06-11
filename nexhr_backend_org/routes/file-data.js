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
const { RoleAndPermission } = require("../models/RoleModel");
const { TimePattern } = require("../models/TimePatternModel");

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(/[:.]+/).map(Number);
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
                                toDate: new Date(today.getTime() + (4 * 1000 * 60 * 60)),
                                periodOfLeave: "half day",
                                reasonForLeave: "Came too late",
                                prescription: "",
                                employee: emp._id,
                                coverBy: null,
                                status: "approved",
                                approvers: {
                                    Manager: "approved",
                                    TeamLead: "approved",
                                    TeamHead: "approved",
                                    Hr: "approved",
                                },
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
                                        <meta charset="UTF-8">
                                            <title>Late Arrival Notice</title>
                                    </head>
                                    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                                        <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                            <div style="margin: 20px 0;">
                                                <h2 style="text-align: center;">You came much later than your permitted time.</h2>
                                                <p>
                                                    So, we are marking you as taking a half-day leave.<br />
                                                    Hereafter, please come early or by (${new Date(emp.workingTimePattern.StartingTime).toLocaleTimeString()}).<br />
                                                    Please follow the company instructions.<br />
                                                    Thank you!
                                                </p>
                                            </div>
                                            <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                                                <p>Have questions? Need help? <a href="mailto:webnexs29@gmail.com" style="color: #777;">Contact our support team</a>.</p>
                                            </div>
                                        </div>
                                    </body>
                                </html>`;

                            sendMail({
                                From: process.env.FROM_MAIL,
                                To: emp.Email,
                                Subject: `Half - day Leave Applied(Unpaid Leave(LWP))`,
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
                                status: "approved",
                                approvers: {
                                    Manager: "approverd",
                                    TeamLead: "approved",
                                    TeamHead: "approved",
                                    Hr: "approved",
                                }
                            };
                            const { error } = LeaveApplicationValidation.validate(halfDayLeaveApp);
                            if (error) {
                                return res.status(400).send({ error: error.details[0].message })
                            }
                            const addLeave = await LeaveApplication.create(halfDayLeaveApp);
                            emp.leaveApplication.push(addLeave._id);
                            await emp.save();

                            const htmlContent = `
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta charset="UTF-8">
                                <title>Late Arrival Notice</title>
                              </head>
                              <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                                <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                  <div style="margin: 20px 0;">
                                    <h2 style="text-align: center;">You came much later than your permitted time.</h2>
                                    <p>
                                      So, we are marking you as taking a half-day leave.<br />
                                      Hereafter, please come early or by (${new Date(emp.workingTimePattern.StartingTime).toLocaleTimeString()}).<br />
                                      Please follow the company instructions.<br />
                                      Thank you!
                                    </p>
                                  </div>
                                  <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                                    <p>Have questions? Need help? <a href="mailto:${process.env.FROM_MAIL}" style="color: #777;">Contact our support team</a>.</p>
                                  </div>
                                </div>
                              </body>
                            </html>`;

                            sendMail({
                                From: process.env.FROM_MAIL,
                                To: emp.Email,
                                Subject: `Half - day Leave Applied(Unpaid Leave(LWP))`,
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
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="UTF-8">
                            <title>Working Hours Summary</title>
                          </head>
                          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 20px;">
                            <h2 style="text-align: center; margin: 20px 0;">Total Working Hours - ${record.totalHours} (Machine Recorded)</h2>
                            <table style="width: 100%; border-collapse: collapse; font-size: 16px; background-color: #fff;">
                              <thead>
                                <tr>
                                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #4CAF50; color: white; text-transform: uppercase;">Activity</th>
                                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #4CAF50; color: white; text-transform: uppercase;">Starting Time</th>
                                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #4CAF50; color: white; text-transform: uppercase;">Ending Time</th>
                                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #4CAF50; color: white; text-transform: uppercase;">Machine Records</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${activitiesData.map((data, index) => `
                                  <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f2f2f2'};">
                                    <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${data.activity[0].toUpperCase() + data.activity.slice(1)}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${data.startingTime}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${data.endingTime}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${record.punchInRecords[index] || "00:00"} - ${record.punchInRecords[index + 1] || "00:00"}</td>
                                  </tr>
                                `).join("")}
                              </tbody>
                            </table>
                          </body>
                        </html>`;

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

router.post("/employees/:id", upload.single("documents"), verifyAdminHR, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: "No file uploaded." });
    }

    const filePath = req.file.path;
    try {
        const inviter = await Employee.findById(req.params.id, "company").populate("company", "logo CompanyName")
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Convert to JSON while trimming empty rows
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }).filter(row => row.some(cell => cell !== null && cell !== ""));

        const defaultRole = await RoleAndPermission.findOne({ RoleName: "Assosiate" }, "_id").lean().exec();
        const defaultTimePattern = await TimePattern.findOne({ DefaultPattern: true }, "_id").lean().exec();

        let employees = [];
        let existsEmps = [];
        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];

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
                    dateOfBirth: new Date(row[7]),
                    gender: row[8],
                    code: row[9],
                    working: row[10],
                    dateOfJoining: new Date(row[11]),
                    employmentType: row[12],
                    description: row[13],
                    bloodGroup: row[14],
                    annualLeaveEntitlement: 14,
                    typesOfLeaveCount: {
                        "Annual Leave": row[12] === "Intern" ? "1" : "7",
                        "Sick Leave": row[12] === "Intern" ? "2" : "7",
                        "permission": "2"
                    },

                    typesOfLeaveRemainingDays: {
                        "Annual Leave": row[12] === "Intern" ? "1" : "7",
                        "Sick Leave": row[12] === "Intern" ? "2" : "7"
                    },
                    company: inviter.company._id,
                    role: defaultRole._id,
                    workingTimePattern: defaultTimePattern._id,
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
                        <title>${inviter.company.CompanyName}</title>
                      </head>
                      <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                        <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          <div style="text-align: center; padding: 20px;">
                            <img src="${inviter.company.logo}" alt="Logo" style="max-width: 100px;" />
                            <h1 style="margin: 0;">Welcome To ${inviter.company.CompanyName}</h1>
                          </div>
                          <div style="margin: 20px 0;">
                            <p>Hey ${addEmp.FirstName} ${addEmp.LastName} 👋,</p>
                            <p><b>Your credentials</b></p><br />
                            <p><b>Email</b>: ${addEmp.Email}</p><br />
                            <p><b>Password</b>: ${addEmp.Password}</p><br />
                            <p>Your details have been registered! Please confirm your email by clicking the button below.</p>
                            <a href="${process.env.FRONTEND_BASE_URL}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirm Email</a>
                          </div>
                          <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                            <p>Have questions? Need help? <a href="mailto:${process.env.FROM_MAIL}" style="color: #777;">Contact our support team</a>.</p>
                          </div>
                        </div>
                      </body>
                    </html>
                  `;

                    sendMail({
                        From: process.env.FROM_MAIL,
                        To: addEmp.Email,
                        Subject: `Welcome To ${inviter.company.CompanyName}`,
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

        // Ensure there is at least one sheet
        if (workbook.SheetNames.length < 2) {
            throw new Error("The second sheet is missing!");
        }

        const sheetName = workbook.SheetNames[1]; // Get the second sheet name
        if (!sheetName) {
            throw new Error("Sheet not found!");
        }

        const monthNumber = months.findIndex(m => m === sheetName.toLowerCase());
        if (monthNumber === -1) {
            throw new Error(`Invalid month detected in sheet name: ${sheetName}`);
        }

        const sheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 0 , raw: false, dateNF: "yyyy-mm-dd hh-mm-ss"});

        let leaveApps = [];
        let existsApps = [];
        const today = new Date();
        today.setMonth(monthNumber);

        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            const name = row["__EMPTY_1"]?.trim(); // Ensure name is trimmed

            Object.entries(row).forEach(([key, value]) => {
                if (!isNaN(Number(key))) { // Check if key is a date
                    const leaveDate = new Date(today);
                    leaveDate.setDate(Number(key));

                    if (["CL / SL", "CL", "SL", "HD", "LOP"].includes(value)) {
                        leaveApps.push({
                            name,
                            date: leaveDate,
                            status: value
                        });
                    }
                }
            });
        }

        if (leaveApps.length === 0) {
            throw new Error("No valid leave entries found in the sheet.");
        }

        // Fetch employee data in bulk
        const employeeMap = {};
        const employeeNames = leaveApps.map(leave => leave.name.split(" ")[0]);
        const employees = await Employee.find({
            FirstName: { $regex: new RegExp(`^(${employeeNames.join("|")})`, "i") }
        });

        employees.forEach(emp => {
            employeeMap[emp.FirstName.toLowerCase()] = emp;
        });

        // Create leave applications in bulk
        const leaveApplications = await Promise.all(leaveApps.map(async leave => {
            const emp = employeeMap[leave.name.split(" ")[0].toLowerCase()];
            if (!emp) return null; // Skip if employee is not found
            if (await LeaveApplication.exists({ employee: emp._id, date: leave.date })) {
                existsApps.push(leave);
                return null;
            } else {
                return {
                    leaveType: leave.status === "CL" ? "Annual Leave"
                        : leave.status === "SL" ? "Sick Leave"
                            : leave.status === "LOP" ? "Unpaid Leave(LOP)"
                                : "Annual Leave",
                    fromDate: leave.date,
                    toDate: leave.date,
                    periodOfLeave: leave.status === "HD" ? "half day" : "full day",
                    reasonForLeave: "Employee's person reason",
                    prescription: "",
                    employee: emp._id.toString(),
                    coverBy: null,
                    status: "approved",
                    TeamLead: "approved",
                    TeamHead: "approved",
                    Hr: "approved",
                    approvedOn: new Date(),
                    approverId: []
                };
            }
        }));

        const onlyLeaveApps = leaveApplications?.filter(leave => leave !== null);
        const createdLeaves = await LeaveApplication.insertMany(onlyLeaveApps);

        // Update employee leave applications
        await Promise.all(createdLeaves.map(async (leave) => {
            const emp = await Employee.findById(leave.employee)

            if (emp) {
                emp.leaveApplication.push(leave._id);
                await emp.save();
            }
        }));

        res.status(200).json({ status: true, message: `${createdLeaves.length} leave applications added and ${existsApps.length} leave application exists.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message || "An error occurred during the bulk import process."
        });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Delete uploaded file
        }
    }
});

module.exports = router