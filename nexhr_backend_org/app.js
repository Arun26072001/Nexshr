// Required Imports
const express = require("express");
const schedule = require("node-schedule");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const path = require("path");

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
// const organization = require("./routes/organization");
// const userAccount = require("./routes/user-account");
const plannerType = require("./routes/planner-type");
const { imgUpload } = require('./routes/imgUpload');
const holidays = require("./routes/holidays");
const report = require("./routes/reports");
const fileData = require("./routes/file-data");
const mailSettings = require("./routes/mail-settings");
const emailTemplate = require("./routes/email-template");
const wfhRouter = require("./routes/wfh-application");
const { sendPushNotification, verifyWorkingTimeCompleted, askReasonForDelay } = require("./auth/PushNotification");

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
// app.use("/api/user-account", userAccount);
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
// app.use("/api/organization", organization);
app.use("/api/payroll", payroll);
app.use("/api/payslip", payslip);
app.use("/api/education", education);
app.use("/api/payslip-info", payslipInfo);
app.use("/api/department", department);
app.use("/api/work-experience", workExp);
app.use("/api/work-place", workPlace);
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
app.use("/api/wfh-application", wfhRouter);
app.use("/api/email-template", emailTemplate);
app.use("/api/planner", plannerType)
app.post("/push-notification", sendPushNotification);
app.post("/verify_completed_workinghour", verifyWorkingTimeCompleted);
app.post("/ask-reason-for-delay", askReasonForDelay);

schedule.scheduleJob("0 0 10 4 * *", async function () {
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
      const [startingHour, startingMin] = [new Date(pattern.StartingTime).getHours(), new Date(pattern.StartingTime).getMinutes()];
      const [finishingHour, finishingMin] = [new Date(pattern.FinishingTime).getHours(), new Date(pattern.FinishingTime).getMinutes()];

      // Schedule job for login
      schedule.scheduleJob(`0 ${startingMin} ${startingHour} * * 1-5`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/ontime/login`);
          console.log("Login Triggered:", response.data.message);
        } catch (error) {
          console.error("Login Error:", error.message);
        }
      });

      // send mail and apply fullday leave
      schedule.scheduleJob(`0 ${finishingMin - 5} ${finishingHour} * * *`, async function () {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clock-ins/not-login/apply-leave/${pattern._id}`);
          console.log("Apply Leave for Not-login Triggered:", response.data.message);
        } catch (error) {
          console.error("Logout Error:", error);
        }
      })
    });
  } catch (error) {
    console.error("Error fetching time patterns:", error);
  }
}

fetchTimePatterns();

schedule.scheduleJob("0 10 * * 1-5", async () => {
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
    console.log("error in reject leave", error);
  }
})

// Start Server
const port = process.env.PORT;

app.listen(port, () => console.log(`Server listening on port ${port}!`));
process.on("uncaughtException", (err) => {
  console.log(err);
});
