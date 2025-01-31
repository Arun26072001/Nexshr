const mongoose = require("mongoose");
const Joi = require('joi');

const LeaveTypeSchema = new mongoose.Schema({
    LeaveName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    Description: { type: String }
})

const LeaveType = mongoose.model("LeaveType", LeaveTypeSchema);

const staticLeavetypes = [
    {
        "LeaveName": "Annual Leave",
        "Description": "Paid leave granted to employees for vacation or personal time off during a year."
    },
    {
        "LeaveName": "Sick Leave",
        "Description": "Leave granted to employees when they are unwell or require medical attention."
    },
    {
        "LeaveName": "Casual Leave",
        "Description": "Short-term leave granted for personal matters or emergencies."
    },
    {
        "LeaveName": "Maternity Leave",
        "Description": "Leave granted to female employees before and after childbirth."
    },
    {
        "LeaveName": "Paternity Leave",
        "Description": "Leave granted to male employees to take care of their newborn child."
    },
    {
        "LeaveName": "Bereavement Leave",
        "Description": "Leave taken due to the loss of an immediate family member."
    },
    {
        "LeaveName": "Compensatory Off",
        "Description": "Leave granted in exchange for working on holidays or extra working hours."
    },
    {
        "LeaveName": "Privilege Leave",
        "Description": "Earned leave that can be accumulated and used later, usually for long breaks."
    },
    {
        "LeaveName": "Unpaid Leave (LWP)",
        "Description": "Leave taken when an employee has no paid leave balance; salary is deducted."
    },
    {
        "LeaveName": "Study Leave",
        "Description": "Leave granted to employees for academic or professional development."
    },
    {
        "LeaveName": "Sabbatical Leave",
        "Description": "Extended leave granted for research, higher studies, or personal development."
    },
    {
        "LeaveName": "Marriage Leave",
        "Description": "Special leave granted for an employee’s wedding."
    },
    {
        "LeaveName": "Adoption Leave",
        "Description": "Leave granted to employees adopting a child."
    },
    {
        "LeaveName": "Half-Day Leave",
        "Description": "Leave for half of the working day, either in the morning or afternoon."
    },
    {
        "LeaveName": "Emergency Leave",
        "Description": "Leave granted in case of an unforeseen urgent personal situation."
    },
    {
        "LeaveName": "Special Leave",
        "Description": "Leave provided for specific situations like blood donation, voting, or military service."
    },
    {
        "LeaveName": "Festival Leave",
        "Description": "Leave granted for religious or cultural festivals."
    }
];
LeaveType.countDocuments().then(count => {
  if (count === 0) {
    LeaveType.insertMany(staticLeavetypes)
      .then(() => console.log("Static Leavetypes inserted!"))
      .catch(err => console.error("Error inserting Leavetypes:", err));
  } else {
    console.log("Leavetypes already exist. Skipping static data insertion.");
  }
});

const LeaveTypeValidation = Joi.object().keys({
    LeaveName: Joi.string().required(),
    Description: Joi.string().optional()
})

module.exports = {
    LeaveType,
    LeaveTypeValidation
};
