const mongoose = require("mongoose");
const Joi = require("joi");

const pageAuthSchema = new mongoose.Schema({
    Administration: { type: String, required: true },
    Attendance: { type: String, required: true },
    Dashboard: { type: String, required: true },
    Employee: { type: String, required: true },
    JobDesk: { type: String, required: true },
    Leave: { type: String, required: true },
    Settings: { type: String, required: true }
});

const PageAuth = mongoose.model("pageAuth", pageAuthSchema);

const pageAuthValidation = Joi.object({
    Administration: Joi.string().valid("allow", "not allow").required(),
    Attendance: Joi.string().valid("allow", "not allow").required(),
    Dashboard: Joi.string().valid("allow", "not allow").required(),
    Employee: Joi.string().valid("allow", "not allow").required(),
    JobDesk: Joi.string().valid("allow", "not allow").required(),
    Leave: Joi.string().valid("allow", "not allow").required(),
    Settings: Joi.string().valid("allow", "not allow").required(),
});

module.exports = { PageAuth, pageAuthValidation }