const mongoose = require("mongoose");
const Joi = require('joi');

const LeaveTypeSchema = new mongoose.Schema({
    LeaveName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    Description: { type: String },
    limitDays: { type: Number }
})

const LeaveType = mongoose.model("LeaveType", LeaveTypeSchema);

// const staticLeavetypes = [
//     {
//         "LeaveName": "Annual Leave",
//         "Description": "Paid leave granted to employees for vacation or personal time off during a year.",
//         "limitDays": 20
//     },
//     {
//         "LeaveName": "Sick Leave",
//         "Description": "Leave granted to employees when they are unwell or require medical attention.",
//         "limitDays": 12
//     },
//     {
//         "LeaveName": "Casual Leave",
//         "Description": "Short-term leave granted for personal matters or emergencies.",
//         "limitDays": 7
//     },
//     {
//         "LeaveName": "Maternity Leave",
//         "Description": "Leave granted to female employees before and after childbirth.",
//         "limitDays": 180
//     },
//     {
//         "LeaveName": "Paternity Leave",
//         "Description": "Leave granted to male employees to take care of their newborn child.",
//         "limitDays": 10
//     },
//     {
//         "LeaveName": "Bereavement Leave",
//         "Description": "Leave taken due to the loss of an immediate family member.",
//         "limitDays": 5
//     },
//     {
//         "LeaveName": "Privilege Leave",
//         "Description": "Earned leave that can be accumulated and used later, usually for long breaks.",
//         "limitDays": 15
//     },
//     {
//         "LeaveName": "Unpaid Leave (LWP)",
//         "Description": "Leave taken when an employee has no paid leave balance; salary is deducted.",
//         "limitDays": 0
//     },
//     {
//         "LeaveName": "Study Leave",
//         "Description": "Leave granted to employees for academic or professional development.",
//         "limitDays": 30
//     },
//     {
//         "LeaveName": "Sabbatical Leave",
//         "Description": "Extended leave granted for research, higher studies, or personal development.",
//         "limitDays": 365
//     },
//     {
//         "LeaveName": "Marriage Leave",
//         "Description": "Special leave granted for an employee’s wedding.",
//         "limitDays": 3
//     },
//     {
//         "LeaveName": "Adoption Leave",
//         "Description": "Leave granted to employees adopting a child.",
//         "limitDays": 30
//     },
//     {
//         "LeaveName": "Half-Day Leave",
//         "Description": "Leave for half of the working day, either in the morning or afternoon.",
//         "limitDays": 0.5
//     },
//     {
//         "LeaveName": "Emergency Leave",
//         "Description": "Leave granted in case of an unforeseen urgent personal situation.",
//         "limitDays": 5
//     },
//     {
//         "LeaveName": "Special Leave",
//         "Description": "Leave provided for specific situations like blood donation, voting, or military service.",
//         "limitDays": 1
//     },
//     {
//         "LeaveName": "Festival Leave",
//         "Description": "Leave granted for religious or cultural festivals.",
//         "limitDays": 2
//     }
// ];
// LeaveType.countDocuments().then(count => {
//     if (count === 0) {
//         LeaveType.insertMany(staticLeavetypes)
//             .then(() => console.log("Static Leavetypes inserted!"))
//             .catch(err => console.error("Error inserting Leavetypes:", err));
//     } else {
//         console.log("Leavetypes already exist. Skipping static data insertion.");
//     }
// });

const LeaveTypeValidation = Joi.object().keys({
    _id: Joi.any().optional(),
    __v: Joi.any().optional(),
    LeaveName: Joi.string().required(),
    Description: Joi.string().optional(),
    limitDays: Joi.number().required().label("LimitDays")
})

module.exports = {
    LeaveType,
    LeaveTypeValidation
};
