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
const employee = require("./routes/employee");
const { leaveApp } = require("./routes/leave-app");
const country = require("./routes/country");
const project = require("./routes/project");
const task = require("./routes/task");
const timePattern = require("./routes/time-pattern");
const companySettings = require("./routes/company-settings");
const workPlace = require("./routes/work-place");
const leaveType = require("./routes/leave-type");
const applicationSettings = require("./routes/application-settings");
const clockIns = require("./routes/clock-ins");
const team = require("./routes/team");
const announcement = require("./routes/announcement");
const teamssample = require("./routes/teamssample");
const payslipInfo = require("./routes/payslipInfo");
const payslip = require("./routes/payslip");
const userPermission = require("./routes/user-permission");
const pageAuth = require("./routes/page-auth");
const plannerType = require("./routes/planner-type");
const { imgUpload } = require('./routes/imgUpload');
const holidays = require("./routes/holidays");
const report = require("./routes/reports");
const fileData = require("./routes/file-data");
const mailSettings = require("./routes/mail-settings");
const emailTemplate = require("./routes/email-template");
const wfhRouter = require("./routes/wfh-application");
const timezone = require("./routes/timezone");
const comment = require("./routes/comments");
const companyPolicy = require("./routes/company-policy");
const notificationSettings = require("./routes/notification-settings");
const category = require("./routes/planner-category");
const { sendPushNotification, askReasonForDelay } = require("./auth/PushNotification");
// for delete soft deleted docs
const deleteOldSoftDeletedDocs = require("./ModelChangeEvents/cleanupScheduler");

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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"],
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
app.use("/api/country", country);
app.use("/api/employee", employee);
// app.use("/api/organization", organization);
app.use("/api/payslip", payslip);
app.use("/api/payslip-info", payslipInfo);
app.use("/api/department", department);
app.use("/api/work-place", workPlace);
app.use("/api/company-settings", companySettings);
app.use("/api/position", position);
app.use("/api/application-settings", applicationSettings);
app.use("/api/leave-type", leaveType);
app.use("/api/leave-application", leaveApp);
app.use("/api/project", project);
app.use("/api/task", task);
app.use("/api/holidays", holidays);
app.use("/api/time-pattern", timePattern);
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
app.use("/api/planner", plannerType);
app.use("/api/timezone", timezone);
app.use("/api/category", category);
app.use("/api/comment", comment);
app.use("/api/company-policy", companyPolicy);
app.use("/api/notification-settings", notificationSettings);
app.post("/push-notification", sendPushNotification);
app.post("/ask-reason-for-delay", askReasonForDelay);

// delete permanently soft deleted docs
deleteOldSoftDeletedDocs();

// Start Server
const port = process.env.PORT;

app.listen(port, () => console.log(`Server listening on port ${port}!`));
process.on("warning", (warning) => {
  console.warn("warning is triggered", warning.stack);
});
process.on("uncaughtException", (err) => {
  console.log("uncaughtException", err);
});
