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
    Administration: Joi.string().optional(),
    Attendance: Joi.string().optional(),
    Dashboard: Joi.string().optional(),
    Employee: Joi.string().optional(),
    JobDesk: Joi.string().optional(),
    Leave: Joi.string().optional(),
    Settings: Joi.string().optional(),
});

module.exports = { PageAuth, pageAuthValidation }