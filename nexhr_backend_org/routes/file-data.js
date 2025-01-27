const express = require("express");
const { verifyAdminHR } = require("../auth/authMiddleware");
const router = express.Router();
const XLSX = require("xlsx");
const { upload } = require("./imgUpload");
const fs = require("fs");
const sendMail = require("./mailSender");
const { Employee } = require("../models/EmpModel");
const { ClockIns } = require("../models/ClockInsModel");

router.post("/", upload.single("documents"), verifyAdminHR, async (req, res) => {
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return (hours * 60 + minutes) || 0; // Defaults to 0 if invalid
    };

    try {
        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: "No file uploaded.",
            });
        }

        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let records = [];
        let importedUserCount = 0;

        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            if (row && row[6]) {
                const punchInRecords = row[6].split(",");
                if (punchInRecords.length > 1) {
                    importedUserCount++;
                    let totalHours = 0;

                    for (let j = 0; j < punchInRecords.length - 1; j++) {
                        const inMinutes = timeToMinutes(punchInRecords[j]);
                        const outMinutes = timeToMinutes(punchInRecords[j + 1]);
                        if (outMinutes > inMinutes) {
                            totalHours += (outMinutes - inMinutes) / 60;
                        }
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
        }

        // Delete uploaded file after processing
        fs.unlinkSync(filePath);

        // Process each record
        for (const record of records) {
            if (Number(record.totalHours) < 8) {
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Set time to 00:00:00.000
                const endOfDay = new Date(today.setHours(23, 59, 59, 999));
                const empOfLastclockins = await Employee.findOne({ code: record.empCode }, "Email")
                    .populate({ path: "clockIns", match: { date: { $gte: startOfDay, $lte: endOfDay } } })
                    .exec();
                console.log(empOfLastclockins);

                if (empOfLastclockins) {
                    const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
                    const clockIn = empOfLastclockins.clockIns[0];
                    const activitiesData = activities.map((activity) => {
                        const startingTime = clockIn?.[activity]?.startingTime?.[0] || "00:00";
                        const endingTime = clockIn?.[activity]?.endingTime?.slice(-1)[0] || "00:00";
                        return {
                            activity,
                            startingTime,
                            endingTime,
                        };
                    });
                    const updatedclockins = {
                        ...clockIn,
                        machineRecords: record.punchInRecords
                    }
                    const updateClokins = await ClockIns.findByIdAndUpdate(clockIn._id, updatedclockins, { new: true })

                    const htmlContent = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Working Hours Alert</title>
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
                            .center_text {
                              text-align: center;
                              margin: 20px 0;
                            }
                          </style>
                        </head>
                        <body>
                          <h2 class="center_text">Total Working Hours - ${record.totalHours}(Machine Recorded)</h2>
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
                                  ${activitiesData
                            .map((data, index) => `
                                      <tr>
                                          <td>${data.activity[0].toUpperCase() + data.activity.slice(1)}</td>
                                          <td>${data.startingTime}</td>
                                          <td>${data.endingTime}</td>
                                         <td>
                                    ${data.activity === "login"
                                    ? `${record.punchInRecords[index] || "00:00"} - ${record.punchInRecords[record.punchInRecords.length - 2] || "00:00"}`
                                    : `${record.punchInRecords[index] || "00:00"} - ${record.punchInRecords[index + 1] || "00:00"}`
                                }
                                            </td>
                                      </tr>
                                  `)
                            .join("")}
                              </tbody>
                          </table>
                        </body>
                        </html>
                    `;

                    sendMail({
                        from: process.env.FROM_MAIL,
                        to: empOfLastclockins.Email,
                        subject: "Incomplete Working Hours Alert",
                        html: htmlContent,
                    });
                }
            }
        }

        res.status(200).json({
            status: true,
            message: "File processed successfully!",
            data: records,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message || "An error occurred during the bulk import process.",
        });
    }
});


module.exports = router