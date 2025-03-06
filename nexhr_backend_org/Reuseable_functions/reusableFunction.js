const mongoose = require("mongoose");

const convertToString = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => (mongoose.isValidObjectId(v) ? v.toString() : v));
  }
  return mongoose.isValidObjectId(value) ? value?.toString() : value;
};

function getDayDifference(leave) {
  if (leave.leaveType === "half day") {
    return 0.5;
  }
  let toDate = new Date(leave.toDate);
  let fromDate = new Date(leave.fromDate);
  let timeDifference = toDate - fromDate;
  return timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);
}

function getWeekdaysOfCurrentMonth(year, month) {// 0-based index (0 = January)

  const weekdays = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get total days in month

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's a weekday (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(currentDate);
    }
  }

  return weekdays.length;
}

function mailContent(type, fromDateValue, toDateValue, emp, leaveType, actionBy) {
  const isRejected = type === "rejected";
  const subject = isRejected
    ? `${emp.FirstName}'s Leave Application has been rejected by ${actionBy}`
    : `${emp.FirstName}'s Leave Application has been approved by ${actionBy}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />
        <title>Leave Application ${isRejected ? "Rejection" : "Approval"} Email</title>
        <style>
          * {
            font-family: "Inter", sans-serif;
            font-display: swap;
          }
          .parent {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .content {
            border: 1px solid gray;
            border-radius: 10px;
            padding: 30px;
            max-width: 500px;
            text-align: left;
            background-color: #fff;
          }
          .underline {
            border-bottom: 3px solid ${isRejected ? "red" : "green"};
            width: 30px;
            margin-bottom: 10px;
          }
          .mailButton {
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 30px;
            background-color: ${isRejected ? "red" : "green"};
            color: white !important;
            border: none;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
          p {
            color: #686D76 !important;
            margin: 10px 0px;
          }
          .container {
            text-align: center;
          }
          img {
            width: 100px;
            height: 100px;
            object-fit: cover;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <img src="logo.png" alt="Company Logo">
          <div class="parent">
            <div class="content">
              <p style="font-size: 20px; font-weight: 500; color: black;">Hi ${emp.FirstName} ${emp.LastName},</p>
              <div class="underline"></div>
              <p style="font-size: 15px; font-weight: 500;">${subject}</p>
              <h3 style="color: #686D76;">Details</h3>
              <p>${leaveType} from 
                ${new Date(fromDateValue).toLocaleString("default", { month: "long" })} ${new Date(fromDateValue).getDate()}, ${new Date(fromDateValue).getFullYear()} 
                to 
                ${new Date(toDateValue).toLocaleString("default", { month: "long" })} ${new Date(toDateValue).getDate()}, ${new Date(toDateValue).getFullYear()}
              </p>
              <a href="${process.env.FRONTEND_URL}" class="mailButton">
                View Leave Details
              </a>
              <p style="font-size: 14px; color: #B4B4B8;">Why did you receive this mail?</p>
              <p style="font-size: 14px; color: #B4B4B8;">Because you applied for this leave.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = { convertToString, getDayDifference, getWeekdaysOfCurrentMonth, mailContent };