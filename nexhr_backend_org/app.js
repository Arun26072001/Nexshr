var express = require("express");
const router = express.Router();
const schedule = require("node-schedule");
const axios = require("axios");
var mongoose = require('mongoose');
var app = express();
require('dotenv').config();
var cors = require('cors')
//router files 
const login = require('./routes/login');
const company = require('./routes/company');
const department = require('./routes/department');
const role = require('./routes/role');
const position = require('./routes/position');
const city = require('./routes/city');
const portal = require('./routes/portal');
const employee = require('./routes/employee');
const familyInfo = require('./routes/family-info');
const salary = require('./routes/salary');
const education = require('./routes/education');
const { leaveApp } = require('./routes/leave-app');
const state = require('./routes/state');
const country = require('./routes/country');
const project = require('./routes/project');
const personalInfo = require('./routes/personal-info');
const workExp = require('./routes/work-exp');
const timePattern = require('./routes/time-pattern');
const companySettings = require('./routes/company-settings');
const workPlace = require("./routes/work-place");
const leaveType = require("./routes/leave-type");
const payroll = require('./routes/payroll');
const applicationSettings = require("./routes/application-settings");
const attendance = require("./routes/attendance");
const clockIns = require("./routes/clock-ins")
const team = require("./routes/team");
const payslipInfo = require("./routes/payslipInfo");
const payslip = require("./routes/payslip");

//connecting to mongodb
let mongoURI = process.env.DATABASEURL;

if (!mongoURI) {
  console.error("MongoDB URI is not defined. Please set it in the environment variables.");
  process.exit(1);
}

// app.use(cors())
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true
}));

// Middleware to handle OPTIONS requests
app.options('*', cors());

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

mongoose
  .connect(mongoURI)
  .then(() => console.log("db connection successful"))
  .catch(err => console.log(err));

//for request body
app.use(express.json());


//API AUTHS
app.get("/", (req, res) => {
  res.send("employee management system API 😀");
});

app.use('/api/login', login)

//role routes
app.use('/api/role', role);
//team router
app.use('/api/team', team)
//city routes
app.use('/api/city', city)
//state routes
app.use('/api/state', state)
//country routes
app.use('/api/country', country)
//use employee router
app.use('/api/employee', employee);
//use famil-info router
app.use('/api/family-info', familyInfo)
//use personal-info router
app.use('/api/personal-info', personalInfo)
//use payroll router
app.use('/api/payroll', payroll);
//use payslip router
app.use('/api/payslip', payslip);
//use education router
app.use('/api/education', education);
//pay slip router
app.use('/api/payslip-info', payslipInfo);
//use department router
app.use('/api/department', department)
//use work-experiance router
app.use('/api/work-experience', workExp)
//use work place router
app.use('/api/work-place', workPlace)
//use company router
app.use('/api/company', company)
//use portal router
app.use('/api/portal', portal)
//use companysettings router
app.use("/api/company-settings", companySettings)
//use position router
app.use('/api/position', position)
//use salary router
app.use('/api/salary', salary)
//use application settings router
app.use('/api/application-settings', applicationSettings);
//Leave type router
app.use("/api/Leave-type", leaveType)
//use leave application emp router
app.use('/api/leave-application', leaveApp)
//use project-bid router
app.use('/api/project', project)
//use timepattern router
app.use('/api/time-pattern', timePattern);
//use attendance router
app.use("/api/attendance", attendance)
//use clock-ins router
app.use("/api/clock-ins", clockIns);

var port = process.env.PORT;
// Schedule the job to run every 14th day of the month at 18:18
const addPayslip = schedule.scheduleJob("10 10 3 * *", async function () {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payslip/`, {
    });
    console.log("Payslip generation response:", response.data);
  } catch (err) {
    console.error("Error while generating payslips:", err);
  }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));
