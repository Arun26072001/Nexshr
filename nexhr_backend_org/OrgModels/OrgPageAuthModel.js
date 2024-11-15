const mongoose = require("mongoose");
const PageAuthSchemas = {};

function getPageAuthSchema(orgName) {
    if (!PageAuthSchemas[orgName]) {
        PageAuthSchemas[orgName] = new mongoose.Schema({
            Administration: { type: String, default: "not allow" },
            Attendance: { type: String, default: "not allow" },
            Dashboard: { type: String, default: "not allow" },
            Employee: { type: String, default: "not allow" },
            JobDesk: { type: String, default: "not allow" },
            Leave: { type: String, default: "not allow" },
            Settings: { type: String, default: "not allow" }
        })
    }
    return PageAuthSchemas[orgName];
}

const PageAuthModels = {};

function getPageAuthModel(orgName) {
    if (!PageAuthModels[orgName]) {
        PageAuthModels[orgName] = mongoose.model(`${orgName}PageAuth`, getPageAuthSchema(orgName));
    }
    return PageAuthModels[orgName];
}

const pageAuthValidation = Joi.object().keys({
    Administration: Joi.string().optional(),
    Attendance: Joi.string().optional(),
    Dashboard: Joi.string().optional(),
    Employee: Joi.string().optional(),
    JobDesk: Joi.string().optional(),
    Leave: Joi.string().optional(),
    Settings: Joi.string().optional(),
});

module.exports = { getPageAuthModel, pageAuthValidation }