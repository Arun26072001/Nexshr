const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment") 
const Joi = require('joi');

const LeaveTypeSchema = new mongoose.Schema({
    LeaveName: {type: String,
        required: true,
        trim:true,
        unique: true},
    Description: {type: String}
})

const LeaveType = mongoose.model("LeaveType", LeaveTypeSchema);
autoIncrement.initialize(mongoose.connection);
LeaveTypeSchema.plugin(autoIncrement.plugin, {
    model: "LeaveType",
    field: "LeaveID"
})

const LeaveTypeValidation = Joi.object().keys({
    LeaveName: Joi.string().required(),
    Description: Joi.string().optional()
})

module.exports = {
    LeaveType,
    LeaveTypeValidation
};
