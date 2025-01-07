// Required Imports
const express = require("express");
const router = express.Router();
const schedule = require("node-schedule");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

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
app.use("/api/holidays", holidays);
app.use("/api/time-pattern", timePattern);
app.use("/api/attendance", attendance);
app.use("/api/clock-ins", clockIns);
app.use("/api/announcements", announcement);
app.use("/api/teamssample", teamssample);
app.use("/api/user-permission", userPermission);
app.use("/api/page-auth", pageAuth);
app.use("/api/upload", imgUpload);


// Create HTTP Server and Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let users = {};

// Socket.IO Connection
io.on("connection", (socket) => {
  // console.log(`A user connected: ${socket.id}`);

  socket.on("registerUser", (userId) => {
    console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
    users[userId] = socket.id;
  });

  socket.on("sendNotification", (userId, title, message) => {
    if (users[userId]) {
      io.to(users[userId]).emit("receiveNotification", { title, message });
      console.log(`Notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} not found`);
    }
  });

  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// generate payslip each month of 5th
const addPayslip = schedule.scheduleJob("0 10 5 * *", async function () {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payslip/`, {});
    console.log("Payslip generation response:", response.data);
  } catch (err) {
    console.error("Error while generating payslips:", err);
  }
});

// const makeKnow = schedule.scheduleJob("*/1 * * * *", async () => {
//   try {
//     const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/leave-application/make-know`);
//     console.log(response.data);
//   } catch (error) {
//     console.log(error.response.data.error);
//   }
// });

// Start Server
const port = process.env.PORT;
server.listen(port, () => console.log(`Server listening on port ${port}!`));
process.on("uncaughtException", (err) => {
  console.log(err);
});
