const express = require("express");
const { verifyAdminHR } = require("../auth/authMiddleware");
const router = express.Router();
const XLSX = require("xlsx");
const { upload } = require("./imgUpload");
const fs = require("fs");
const sendMail = require("./mailSender");
const { Employee } = require("../models/EmpModel");
const { ClockIns } = require("../models/ClockInsModel");
const { LeaveApplication } = require("../models/LeaveAppModel");

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
};

// Upload and process attendance file
router.post("/", upload.single("documents"), verifyAdminHR, async (req, res) => {
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
            const emp = await Employee.findOne({ code: record.empCode }, "Email workingTimePattern clockIns leaveApplication")
                .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
                .populate({ path: "leaveApplication", match: { fromDate: { $gte: startOfDay, $lte: endOfDay }, status: "approved" } })
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
                        await LeaveApplication.create(halfDayLeaveApp);
                        continue;
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
                        from: process.env.FROM_MAIL,
                        to: emp.Email,
                        subject: "Incomplete Working Hours Alert",
                        html: emailHtml,
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


module.exports = router