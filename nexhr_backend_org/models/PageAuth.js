const mongoose = require("mongoose");
const Joi = require("joi");

const pageAuthSchema = new mongoose.Schema({
    Administration: { type: String, default: "not allow" },
    Attendance: { type: String, default: "not allow" },
    Dashboard: { type: String, default: "not allow" },
    Employee: { type: String, default: "not allow" },
    JobDesk: { type: String, default: "not allow" },
    Leave: { type: String, default: "not allow" },
    Settings: { type: String, default: "not allow" }
});

const PageAuth = mongoose.model("PageAuth", pageAuthSchema);

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