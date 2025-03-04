const mongoose = require("mongoose");

const convertToString = (value) => {
    if (Array.isArray(value)) {
        return value.map((v) => (mongoose.isValidObjectId(v) ? v.toString() : v));
    }
    return mongoose.isValidObjectId(value) ? value?.toString() : value;
};

function getDayDifference(leave) {
    if(leave.leaveType === "half day"){
      return 0.5;
    }
    let toDate = new Date(leave.toDate);
    let fromDate = new Date(leave.fromDate);
    let timeDifference = toDate - fromDate;
    return timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);
  }

module.exports = {convertToString, getDayDifference};