const mongoose = require("mongoose");
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isoWeek = require('dayjs/plugin/isoWeek');
const { toZonedTime } = require('date-fns-tz');
const { format } = require("date-fns");
const isBetween = require('dayjs/plugin/isBetween');
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const { Holiday } = require("../models/HolidayModel");
const { Employee } = require("../models/EmpModel");
const { ErrorLog } = require("../models/ErrorLogModel");

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

function categorizeTasks(tasks = []) {
  const today = dayjs().startOf('day');
  const endOfWeek = dayjs().endOf('week');
  const startOfNextWeek = dayjs().add(1, 'week').startOf('week');
  const endOfNextWeek = dayjs().add(1, 'week').endOf('week');
  const twoWeeksLater = dayjs().add(2, 'week').endOf('week');

  let result = {
    "Overdue": [],
    "Due Today": [],
    "Due This Week": [],
    "Due Next Week": [],
    "Due Over Two Weeks": [],
    "No Deadline": [],
    "Completed": []
  };
  if (tasks.length) {
    tasks.forEach(task => {
      if (task.status === "Completed") {
        result["Completed"].push(task);
      } else if (!task.to) {
        result["No Deadline"].push(task);
      } else {
        const due = dayjs(task.to).startOf('day');
        if (due?.isBefore(today)) {
          result["Overdue"].push(task);
        } else if (due?.isSame(today)) {
          result["Due Today"].push(task);
        } else if (due?.isBefore(endOfWeek)) {
          result["Due This Week"].push(task);
        } else if (due.isBetween(startOfNextWeek, endOfNextWeek, null, '[]')) {
          result["Due Next Week"].push(task);
        } else if (due?.isAfter(endOfNextWeek)) {
          result["Due Over Two Weeks"].push(task);
        }
      }
    });
  }

  return result;
}

async function checkLoginForOfficeTime(scheduledTime, actualTime, permissionTime = 0) {

  // Parse scheduled andl actual time into hours and minutes
  const [scheduledHours, scheduledMinutes] = scheduledTime.split(/[:.]+/).map(Number);
  const [actualHours, actualMinutes] = actualTime.split(/[:.]+/).map(Number);

  // Create Date objects for both scheduled and actual times
  const scheduledDate = new Date(2000, 0, 1, scheduledHours + (permissionTime), scheduledMinutes);
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

const convertToString = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => (mongoose.isValidObjectId(v) ? v.toString() : v));
  }
  return mongoose.isValidObjectId(value) ? value?.toString() : value;
};

function isValidLeaveDate(holidays = [], WeeklyDays = [], target) {
  const date = new Date(target);
  const dayName = format(date, "EEEE"); // e.g., 'Monday', 'Tuesday', etc.

  const isHoliday = checkDateIsHoliday(holidays, date);
  const isWeeklyOff = !WeeklyDays.includes(dayName);

  // A valid leave date is one that is NOT a holiday AND NOT a weekly off
  return isHoliday || isWeeklyOff;
}

function setPeriodOfLeave(leave) {
  // check diff of from and toDate leave
  const fromDate = new Date(leave.fromDate).getTime();
  const toDate = new Date(leave.toDate).getTime();
  const diff = (toDate - fromDate) / (1000 * 60 * 60);
  if (diff > 8) {
    return "full day";
  } else {
    return "half day";
  }
}

async function rangeofDate(fromDate, toDate, empData) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const holidayData = await Holiday.findOne({ currentYear: new Date().getFullYear() }).lean().exec();
  const holidays = Array.isArray(holidayData.holiday) && holidayData.holiday.length > 0 ? holidayData.holiday : []
  const empId = typeof empData === "object" ? empData?._id : empData
  const emp = await Employee.findById(empId, "workingTimePattern")
    .populate("workingTimePattern", "WeeklyDays").lean().exec();
  const empTimePatternWorkingDays = emp?.workingTimePattern && Array.isArray(emp.workingTimePattern.WeeklyDays) ? emp.workingTimePattern.WeeklyDays : [];
  let dayCount = 0;
  while (from <= to) {
    const date = new Date(from);
    if (isValidLeaveDate(holidays, empTimePatternWorkingDays, date)) {
      dayCount += 1
    }
    from.setDate(from.getDate() + 1); // <- Corrected here
  }
  return dayCount;
}

async function getDayDifference({ fromDate, toDate, employee, periodOfLeave }) {
  let dayDifference = 0;
  if (periodOfLeave === "half day") {
    return 0.5;
  }

  dayDifference = await rangeofDate(fromDate, toDate, employee)
  return dayDifference;
}

function accountFromRole(account) {
  if (account === 1) {
    return "admin"
  } if (account === 2) {
    return "hr"
  } if (account === 3) {
    return "emp"
  } if (account === "4") {
    return "manager"
  } if (account === "5") {
    return "network-admin"
  }
}

function checkDateIsHoliday(holidays, targetDate) {
  const targetStr = format(new Date(targetDate), "yyyy-MM-dd"); // normalize to date string
  return holidays.some(holiday => {
    return holiday.date === targetStr
  });
}

const sumLeaveDays = async (leaveArray) => {
  const dayDiffs = await Promise.all(leaveArray.map(getDayDifference));
  return dayDiffs.reduce((a, b) => a + b, 0);
};

function getValidLeaveDays(holidays = [], WeeklyDays = [], from, to) {
  let date = new Date(from);
  const endDate = new Date(to);
  const validDays = [];

  while (date <= endDate) {
    const dateStr = date.toLocaleString("default", { weekday: "long" })
    if (WeeklyDays.includes(dateStr) && !checkDateIsHoliday(holidays, date)) {
      validDays.push(new Date(date).toLocaleDateString("en-GB"));
    }

    // Move to next day
    date.setDate(date.getDate() + 1);
  }

  return validDays;
}

function getWeekdaysOfCurrentMonth(year, month, holidays) {// 0-based index (0 = January)
  const weekdays = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get total days in month

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's a weekday (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.includes(day)) {
      weekdays.push(currentDate);
    }
  }

  return weekdays.length;
}

function mailContent(type, fromDateValue, toDateValue, emp, leaveType, actionBy, member) {
  const isRejected = type === "rejected";
  const actualFromDate = changeClientTimezoneDate(fromDateValue);
  const actualToDate = changeClientTimezoneDate(toDateValue);
  const formattedFromDate = `${new Date(actualFromDate).toLocaleString("default", { month: "long" })} ${new Date(actualFromDate).getDate()}, ${new Date(actualFromDate).getFullYear()}`;
  const formattedToDate = `${new Date(actualToDate).toLocaleString("default", { month: "long" })} ${new Date(actualToDate).getDate()}, ${new Date(actualToDate).getFullYear()}`
  const subject = isRejected
    ? `${emp.FirstName}'s ${leaveType === "WFH" ? "WFH Request" : leaveType.toLowerCase() === "permission" ? "Permission" : "Leave Application"} has been rejected by ${actionBy}`
    : `${emp.FirstName}'s ${leaveType === "WFH" ? "WFH Request" : leaveType.toLowerCase() === "permission" ? "Permission" : "Leave Application"} has been approved by ${actionBy}`;

  return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Application ${isRejected ? "Rejection" : "Approval"} Email</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0; text-align: center;">
    <div style="text-align: center;">
      <img src="${emp.company.logo}" alt="Company Logo" style="width: 100px; height: 100px; object-fit: cover; margin-top: 20px;" />
      <div style="display: flex; max-width:600px; margin:0 auto; padding: 20px;">
        <div style="border: 1px solid gray; border-radius: 10px; padding: 30px; max-width: 500px; text-align: left; background-color: #fff;">
          <p style="font-size: 20px; font-weight: 500; color: black; margin: 10px 0;">Hi ${member.name},</p>
          <div style="border-bottom: 3px solid ${isRejected ? "red" : "green"}; width: 30px; margin-bottom: 10px;"></div>
          <p style="font-size: 15px; font-weight: 500; margin: 10px 0;">${subject}</p>
          <h3 style="color: #686D76; margin: 10px 0;">Details</h3>
          <p style="font-size: 14px; color: #686D76; margin: 10px 0;">
            ${leaveType} from 
            ${formattedFromDate} 
            to  
            ${formattedToDate}
          </p> 
     <p>
  Your request for ${leaveType} on  ${formattedFromDate}  has been 
  ${isRejected
      ? "not approved due to Team Workload."
      : "approved."
    }
</p>
<p>
  ${isRejected
      ? "Please connect with your reporting manager or HR if you need further clarification."
      : "Please ensure proper handover of tasks (if applicable) and adhere to any required guidelines during your time off or remote work."
    }
</p>
<p>
  Regards,<br />
  Kavya<br />
  HR Department
</p>
          <a href="${process.env.FRONTEND_BASE_URL}" style="font-weight: bold; padding: 12px 24px; border-radius: 30px; background-color: ${isRejected ? "red" : "green"}; color: white; text-decoration: none; display: inline-block; margin: 15px 0; border: none;">View Leave Details</a>
          <p style="font-size: 14px; color: #B4B4B8; margin: 10px 0;">Why did you receive this mail?</p>
          <p style="font-size: 14px; color: #B4B4B8; margin: 10px 0;">
            ${["admin", "lead", "head", "manager"].includes(member.type) ? `Because you are the ${member.type} for this employee` : "Because you applied for this leave."}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

function projectMailContent(emp, creator, company, dataObj, type) {
  const empName = `${emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1)} ${emp.LastName}`;
  const creatorName = creator.FirstName[0].toUpperCase() + creator.FirstName.slice(1);
  const itemTitle = type === "project" ? dataObj.name : dataObj.title;
  const formattedTitle = itemTitle[0].toUpperCase() + itemTitle.slice(1);

  const actionText = type === "project"
    ? `${creatorName} has created a project named "<strong>${formattedTitle}</strong>" and added you as a team member.`
    : `${creatorName} has assigned you a task titled "<strong>${formattedTitle}</strong>".`;

  const instructionText = type === "project"
    ? "Please follow the project guidelines and collaborate with your team."
    : "Please review the task and complete it as per the given instructions.";

  const headingText = type === "project"
    ? `Welcome to ${formattedTitle}`
    : `New Task Assigned: ${formattedTitle}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${company.CompanyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
      <div style="text-align: center; padding-top: 30px;">
        <img src="${company.logo}" alt="Company Logo" style="width: 100px; height: 100px; object-fit: cover; margin-bottom: 10px;" />
      </div>

      <div style="display: flex; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: left;">
          <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 10px;">${headingText}</h2>
          <div style="border-bottom: 3px solid #28a745; width: 30px; margin-bottom: 20px;"></div>

          <p style="font-size: 15px; margin-bottom: 15px;">Hi ${empName} 👋,</p>
          <p style="font-size: 15px; margin-bottom: 10px;">${actionText}</p>
          <p style="font-size: 15px; margin-bottom: 10px;">${instructionText}</p>

          <p style="margin-top: 20px;">Thank you!</p>
        </div>
      </div>

      <div style="text-align: center; font-size: 13px; color: #777; margin-top: 20px; padding-bottom: 20px;">
        <p>Have questions? <a href="mailto:${creator.Email}" style="color: #007BFF; text-decoration: none;">Contact ${creatorName}</a>.</p>
      </div>
    </body>
    </html>
  `;
}

// Process activity data: calculates total duration and adds timeHolder
const activities = ["login", "meeting", "morningBreak", "lunch", "eveningBreak", "event"];
function processActivityDurations(record) {
  activities.forEach((activity) => {
    const startingTimes = record[activity]?.startingTime || [];
    const endingTimes = record[activity]?.endingTime || [];

    const durations = startingTimes.map((startTime, i) => {
      const start = timeToMinutes(startTime);
      const end = endingTimes[i] ? timeToMinutes(endingTimes[i]) : getCurrentTimeInMinutes();
      return Math.abs(end - start);
    });

    const total = durations.reduce((sum, mins) => sum + mins, 0);
    if (!record[activity]) record[activity] = {};
    record[activity].timeHolder = formatTimeFromMinutes(total);
  });

  return activities.map((activity) => {
    const start = record[activity]?.startingTime?.[0] || "00:00";
    const end = record[activity]?.endingTime?.slice(-1)?.[0] || "00:00";
    const timeCalMins = timeToMinutes(record[activity]?.timeHolder || "00:00:00");
    return { activity, startingTime: start, endingTime: end, timeCalMins };
  });
}

async function fetchFirstTwoItems() {
  try {
    const items = await PlannerCategory.find().limit(2);
    const itemsId = items.map((item) => item._id)
    return itemsId;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

function timeToMinutes(timeStr) {
  if (typeof timeStr === 'object') {
    const timeData = new Date(timeStr).toTimeString().split(' ')[0]
    const [hours, minutes, seconds] = timeData.split(/[:.]+/).map(Number)
    return Number(((hours * 60) + minutes + (seconds / 60)).toFixed(2)) || 0;
  }
  if (timeStr.split(/[:.]+/).length > 0) {
    const [hours, minutes] = timeStr.split(/[:.]+/).map(Number);
    return Number(((hours * 60) + minutes).toFixed(2)) || 0; // Defaults to 0 if input is invalid
  }
}

function changeClientTimezoneDate(date) {
  const actualDate = toZonedTime(new Date(date), process.env.TIMEZONE);
  return actualDate
}

const getCurrentTimeInMinutes = () => {
  const now = new Date().toLocaleTimeString('en-US', { timeZone: process.env.TIMEZONE, hourCycle: 'h23' });
  const timeWithoutSuffix = now.replace(/ AM| PM/, ""); // Remove AM/PM
  const [hour, min, sec] = timeWithoutSuffix.split(/[:.]+/).map(Number);
  return timeToMinutes(`${hour}:${min}:${sec}`);
};

const getCurrentTime = (date) => {
  const now = new Date(date).toLocaleTimeString('en-US', { timeZone: process.env.TIMEZONE, hourCycle: 'h23' });
  const [hour, min] = now.split(/[:.]+/).map(Number);
  return `${hour}:${min}`
}

function formatTimeFromMinutes(minutes) {
  if ([NaN, 0].includes(minutes)) {
    return `00:00:00`;
  } else {
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
}

const checkLogin = (scheduledTime, actualTime) => {
  const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
  const [actualHours, actualMinutes] = actualTime.split(':').map(Number);

  const scheduledDate = new Date(2000, 0, 1, schedHours, schedMinutes);
  const actualDate = new Date(2000, 0, 1, actualHours, actualMinutes);

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

function getTotalWorkingHourPerDayByDate(start, end) {
  if (start && end) {
    // Calculate the difference in milliseconds
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    let timeDifference;
    if (endTime > startTime) {
      timeDifference = end - start;
    } else {
      timeDifference = start - end
    }

    const diffHrs = timeDifference / (1000 * 60 * 60); // Convert milliseconds to hours
    return diffHrs > 0 ? diffHrs : 0; // Ensure non-negative value
  } else return 0;
}

// Function to calculate working hours between start and end times
function getTotalWorkingHourPerDay(startingTime, endingTime) {
  if (startingTime !== "00:00:00" && endingTime) {
    const [startHour, startMin, startSec] = startingTime.split(":").map(Number);
    const [endHour, endMin, endSec] = endingTime.split(":").map(Number);

    const start = new Date();
    const end = new Date();

    start.setHours(startHour, startMin, startSec, 0);
    end.setHours(endHour, endMin, endSec, 0);

    // Ensure end is after start
    if (end < start) {
      return 0;
    }

    const timeDifference = end.getTime() - start.getTime(); // in milliseconds
    const totalMinutes = Math.floor(timeDifference / (1000 * 60));

    return totalMinutes / 60; // return in hours
  } else {
    return 0;
  }
}

const getTotalWorkingHoursExcludingWeekends = (start, end, dailyHours = 0, holidays = [], WeeklyDays = []) => {
  let totalHours = 0;
  const from = new Date(start);
  const to = new Date(end);
  while (from <= to) {
    const date = new Date(from);
    if (!isValidLeaveDate(holidays, WeeklyDays, date)) {
      totalHours += dailyHours
    }
    from.setDate(from.getDate() + 1); // <- Corrected here
  }
  return totalHours;
};

const connections = {};
const getOrgDB = async (organizationId) => {
  if (connections[organizationId]) {
    return connections[organizationId];
  }

  const dbName = `teamnex_${organizationId}`;
  const mongoURI = process.env.DATABASEURL;

  const newConnection = mongoose.createConnection(mongoURI, {
    dbName
  });

  await new Promise((resolve, reject) => {
    newConnection.once('connected', () => {
      console.log(`✅ MongoDB connected: ${dbName}`);
      resolve();
    });

    newConnection.once('error', (err) => {
      console.error(`❌ MongoDB connection error: ${dbName}`, err);
      reject(err);
    });
  });
  console.log(`📌 New DB Connection: ${mongoURI}/${dbName}`);

  connections[organizationId] = newConnection;
  return newConnection;
};

// Helper function to format leave data
const formatLeaveData = (leave) => ({
  ...leave,
  prescription: leave.prescription ? `${process.env.REACT_APP_API_URL}/uploads/${leave.prescription}` : null
});

function formatDate(date) {
  const actualDate = new Date(date)
  const dateValue = actualDate.getDate();
  const monthString = actualDate.toLocaleString("default", { month: "short" })
  return `${dateValue + " " + monthString + " " + String(actualDate.getHours()).padStart(2, "0") + ":" + String(actualDate.getMinutes()).padStart(2, "0")}`
}

async function errorCollector(errorLog) {
  try {
    const addLog = await ErrorLog.create(errorLog);
    console.log("error log recoderd.", addLog)
  } catch (error) {
    console.log("error in add errorLog", error);
  }
}

module.exports = { convertToString, setPeriodOfLeave, isValidLeaveDate, errorCollector, getTotalWorkingHourPerDay, getTotalWorkingHourPerDayByDate, accountFromRole, changeClientTimezoneDate, sumLeaveDays, getValidLeaveDays, fetchFirstTwoItems, getCurrentTime, checkLoginForOfficeTime, categorizeTasks, projectMailContent, processActivityDurations, formatLeaveData, getDayDifference, getOrgDB, formatDate, getWeekdaysOfCurrentMonth, mailContent, checkLogin, getTotalWorkingHoursExcludingWeekends, getCurrentTimeInMinutes, timeToMinutes, formatTimeFromMinutes };
