// Required Imports
const express = require("express");
const schedule = require("node-schedule");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

// models or schema
const { TimePattern } = require("./models/TimePatternModel");

// routes
const login = require("./routes/login");
const company = require("./routes/company");
const department = require("./routes/department");
const role = require("./routes/role");
const position = require("./routes/position");
const city = require("./routes/city");
const portal = require("./routes/portal");
const employee = require("./routes/employee");
const familyInfo = require("./routes/family-info");
const salary = require("./routes/salary");
const education = require("./routes/education");
const { leaveApp } = require("./routes/leave-app");
const state = require("./routes/state");
const country = require("./routes/country");
const project = require("./routes/project");
const task = require("./routes/task");
const personalInfo = require("./routes/personal-info");
const workExp = require("./routes/work-exp");
const timePattern = require("./routes/time-pattern");
const companySettings = require("./routes/company-settings");
const workPlace = require("./routes/work-place");
const leaveType = require("./routes/leave-type");
const payroll = require("./routes/payroll");
const applicationSettings = require("./routes/application-settings");
const attendance = require("./routes/attendance");
const clockIns = require("./routes/clock-ins");
const team = require("./routes/team");
const announcement = require("./routes/announcement");
const teamssample = require("./routes/teamssample");
const payslipInfo = require("./routes/payslipInfo");
const payslip = require("./routes/payslip");
const userPermission = require("./routes/user-permission");
const pageAuth = require("./routes/page-auth");
const organization = require("./routes/organization");
const userAccount = require("./routes/user-account");
const { imgUpload } = require('./routes/imgUpload');
const holidays = require("./routes/holidays");
const report = require("./routes/reports");
const fileData = require("./routes/file-data");
const mailSettings = require("./routes/mail-settings");
const { Employee } = require("./models/EmpModel");
const { timeToMinutes, getCurrentTimeInMinutes, getTotalWorkingHourPerDay } = require("./Reuseable_functions/reusableFunction");

// MongoDB Connection
const mongoURI = process.env.DATABASEURL;
if (!mongoURI) {
  console.error("MongoDB URI is not defined. Please set it in the environment variables.");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000
  })
  .then(() => console.log("db connection successful"))
  .catch(err => console.log(err));

app.use((req, res, next) => {
  const ext = path.extname(req.url);
  if (['.css', '.js', '.png', '.jpg', '.webp', '.svg', '.woff2'].includes(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  next();
});

// Set CORS Options
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  })
);
app.options("*", cors());

// Express Middleware
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Endpoints
app.get("/", (req, res) => {
  require("dns").resolve("www.google.com", function (err) {
    if (err) {
      res.status(1024).send("Network not Connected!");
    } else {
      res.send({ message: "API and Network connected!" });
    }
  });
});

// Routers
app.use("/api/user-account", userAccount);
app.use("/api/company", company);
app.use("/api/login", login);
app.use("/api/role", role);
app.use("/api/team", team);
app.use("/api/city", city);
app.use("/api/state", state);
app.use("/api/country", country);
app.use("/api/employee", employee);
app.use("/api/family-info", familyInfo);
app.use("/api/personal-info", personalInfo);
app.use("/api/organization", organization);
app.use("/api/payroll", payroll);
app.use("/api/payslip", payslip);
app.use("/api/education", education);
app.use("/api/payslip-info", payslipInfo);
app.use("/api/department", department);
app.use("/api/work-experience", workExp);
app.use("/api/work-place", workPlace);
// app.use("/api/company", company);
app.use("/api/portal", portal);
app.use("/api/company-settings", companySettings);
app.use("/api/position", position);
app.use("/api/salary", salary);
app.use("/api/application-settings", applicationSettings);
app.use("/api/leave-type", leaveType);
app.use("/api/leave-application", leaveApp);
app.use("/api/project", project);
app.use("/api/task", task);
app.use("/api/holidays", holidays);
app.use("/api/time-pattern", timePattern);
app.use("/api/attendance", attendance);
app.use("/api/clock-ins", clockIns);
app.use("/api/announcements", announcement);
app.use("/api/teamssample", teamssample);
app.use("/api/user-permission", userPermission);
app.use("/api/page-auth", pageAuth);
app.use("/api/upload", imgUpload);
app.use("/api/report", report)
app.use("/api/google-sheet/upload", fileData);
app.use("/api/mail-settings", mailSettings);

// Create HTTP Server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

let onlineUsers = {}; // Store online users { employeeId: socketId }

// Socket.IO Connection
io.on("connection", (socket) => {
  // Employee joins a room
  socket.on("join_room", (employeeId) => {
    onlineUsers[employeeId] = socket.id; // ✅ Map employee ID to socket ID
  });

  // HR sends an announcement
  socket.on("send_announcement", (data) => {

    data.selectTeamMembers.forEach((employeeId) => {
      const employeeSocketID = onlineUsers[employeeId]; // Get employee's socket ID

      if (employeeSocketID) {
        (employeeSocketID).emit("receive_announcement", data);
      } else {
        console.log(`Employee ${employeeId} is offline, skipping.`);
      }
    });
  });

  // Sending a delayed notification
  socket.on("send_notification", (data) => {

    // Ensure `time` is valid
    const delay = Number(data.time) * 60000;
    if (isNaN(delay) || delay <= 0) {
      console.error("Invalid delay time:", data.time);
      return;
    }

    setTimeout(async () => {
      const timerData = await axios.get(`${process.env.REACT_APP_API_URL}/api/clock-ins/item/${data.timerId}`, {
        headers: { Authorization: data.token }
      })
      if (timerData[data.timeOption].startingTime.length !== timerData[data.timeOption].endingTime.length) {
        try {
          const res = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/clock-ins/remainder/${data.employee}/${data.timeOption}`
          );
          const employeeSocketID = onlineUsers[data.employee]; // ✅ Get correct socket ID
          if (employeeSocketID) {
            io.to(employeeSocketID).emit("Ask_reason_for_late", {
              message: "Why were you late?"
            });
            // console.log(`Sent Ask_reason_for_late to Employee ${data.employee}`);
          } else {
            console.log(`User ${data.employee} is offline, skipping emit.`);
          }
        } catch (error) {
          console.error("Error sending remainder request:", error.message);
        }
      }
    }, delay);
  });

  // Sending a delayed remainder
  socket.on("remainder_notification", (data) => {

    // Ensure `time` is valid
    const delay = Number(data.time) * (1000 * 60 * 60);
    if (isNaN(delay) || delay <= 0) {
      console.error("Invalid delay time:", data.time);
      return;
    }

    setTimeout(async () => {

      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clock-ins/sendmail/${data.employee}/${data.clockinsId}`
        );

      } catch (error) {
        console.log(error);
        console.error("Error sending remainder request:", error.message);
      }
    }, delay);
  });

  //verify is completed today workinghour
  socket.on("verify_completed_workinghour", async (data) => {
    const empData = await Employee.findById(data.employee, "workingTimePattern")
      .populate("workingTimePattern").exec();

    let startingTimes = data.login?.startingTime;
    let endingTimes = data.login?.endingTime;

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
    const scheduleWorkingHours = getTotalWorkingHourPerDay(
      empData.workingTimePattern.StartingTime,
      empData.workingTimePattern.FinishingTime
    )
    let isCompleteworkingHours = true;

    if (scheduleWorkingHours > totalValue) {
      isCompleteworkingHours = false;
      const employeeSocketID = onlineUsers[empData._id]; // ✅ Get correct socket ID
      if (employeeSocketID) {
        io.to(employeeSocketID).emit("early_logout", {
          message: "Why are you logout early?",
          isCompleteworkingHours
        });
        console.log(`Sent early_logout to Employee ${empData._id}`);
      } else {
        console.log(`User ${data.employee} is offline, skipping emit.`);
      }
    }
  })

  // update task in Comments(CURD operation with socket)
  socket.on("updatedTask_In_AddComment", async (data, empId, token) => {

    try {
      const updateTask = await axios.put(`${process.env.REACT_APP_API_URL}/api/task/${empId}/${data._id}`, data, {
        headers: {
          Authorization: token || ""
        }
      });

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/task/${data._id}`, {
        params: {
          withComments: true
        },
        headers: {
          Authorization: token || ""
        }
      })

      res.data.assignedTo.map((emp) => {
        const employeeSocketID = onlineUsers[emp._id];
        io.to(employeeSocketID).emit("send_updated_task", res.data)
      })
    } catch (error) {
      console.log(error);

      console.log(error.response.data.error);
    }
  })

  // Handle user disconnection
  socket.on("disconnect", () => {
    let disconnectedEmployee = null;

    for (const [employeeID, socketID] of Object.entries(onlineUsers)) {
      if (socketID === socket.id) {
        disconnectedEmployee = employeeID;
        delete onlineUsers[employeeID]; // ✅ Remove user from online list
        break;
      }
    }

    if (disconnectedEmployee) {
      console.log(`Employee ${disconnectedEmployee} disconnected.`);
    }
  });
});

schedule.scheduleJob("0 55 17 2 * *", async function () {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payslip/`, {});
    console.log("Payslip generation response:", response.data);
  } catch (err) {
    console.error("Error while generating payslips:", err);
  }
});
async function fetchTimePatterns() {
  try {
    const timePatterns = await TimePattern.find();

    timePatterns.forEach((pattern) => {
      const [startingHour, startingMin] = pattern.StartingTime.split(":").map(Number);
      const [finishingHour, finishingMin] = pattern.FinishingTime.split(":").map(Number);

      // Schedule job for login
      schedule.scheduleJob(`0 ${startingMin} ${startingHour} * * 1-5`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/ontime/login`);
          console.log("Login Triggered:", response.data.message);
        } catch (error) {
          console.error("Login Error:", error.message);
        }
      });

      // apply permission for late late emps
      schedule.scheduleJob(`0 ${startingMin + 5} ${startingHour} * * 1-5`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/auto-permission/${pattern._id}`)
          console.log(response.data.message);
        } catch (error) {
          console.log(error);
        }
      })

      // send mail and apply fullday leave
      schedule.scheduleJob(`0 ${finishingMin - 5} ${finishingHour} * * 1-5`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/not-login/apply-leave`);
          console.log("Apply Leave for Not-login Triggered:", response.data.message);
        } catch (error) {
          console.error("Logout Error:", error);
        }
      })

      // Schedule job for logout
      schedule.scheduleJob(`0 ${finishingMin} ${finishingHour} * * 1-5`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/ontime/logout`);
          console.log("Logout Triggered:", response.data.message);
        } catch (error) {
          console.error("Logout Error:", error);
        }
      });
    });
  } catch (error) {
    console.error("Error fetching time patterns:", error);
  }
}

// Call function to schedule jobs
fetchTimePatterns();

schedule.scheduleJob("0 10 * * *", async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/leave-application/make-know`);
    console.log(response.data);
  } catch (error) {
    console.log(error.response.data.error);
  }
});

schedule.scheduleJob("0 7 * * *", async () => {
  try {
    const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/leave-application/reject-leave`);
    console.log(res.data);
  } catch (error) {
    console.log(error);
  }
})

// Start Server
const port = process.env.PORT;

server.listen(port, () => console.log(`Server listening on port ${port}!`));
process.on("uncaughtException", (err) => {
  console.log(err);
});
