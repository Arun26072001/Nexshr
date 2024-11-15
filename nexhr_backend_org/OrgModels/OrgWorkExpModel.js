const mongoose = require("mongoose");

const OrgWorkExpSchemas = {};

function getWorkExpSchema(orgName) {
    if (!OrgWorkExpSchemas[orgName]) {
        OrgWorkExpSchemas[orgName] = new mongoose.Schema({
            companyName: { type: String, required: true },
            designation: { type: String, required: true },
            fromDate: { type: Date, required: true },
            toDate: { type: Date, required: true }
        })
    }
    return OrgWorkExpSchemas[orgName];
}

const OrgWorkExpModels = {};

function getWorkExpModel(orgName) {
    if (!OrgWorkExpModels[orgName]) {
        OrgWorkExpModels[orgName] = mongoose.model(`${orgName}WorkExp`, getWorkExpSchema(orgName));
    }
    return OrgWorkExpModels[orgName];
}

const WorkExperienceValidation = Joi.object().keys({
    CompanyName: Joi.string()
        .max(200)
        .required(),
    Designation: Joi.string()
        .max(200)
        .required(),
    FromDate: Joi.date().required(),
    ToDate: Joi.date().required()
});

module.exports = { getWorkExpModel, WorkExperienceValidation }