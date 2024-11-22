const mongoose = require("mongoose");
const Joi = require('joi');

const LeaveTypeSchema = new mongoose.Schema({
    LeaveName: {type: String,
        required: true,
        trim:true,
        unique: true},
    Description: {type: String}
})

const LeaveType = mongoose.model("LeaveType", LeaveTypeSchema);

const LeaveTypeValidation = Joi.object().keys({
    LeaveName: Joi.string().required(),
    Description: Joi.string().optional()
})

module.exports = {
    LeaveType,
    LeaveTypeValidation
};
