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

module.exports = { convertToString, getDayDifference, getWeekdaysOfCurrentMonth };