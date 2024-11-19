const mongoose = require("mongoose");
const Joi = require("joi");
const OrganizationSettingsSchemas = {};

function getOrganizationSettingsSchema(orgName) {
    if (!OrganizationSettingsSchemas[orgName]) {
        OrganizationSettingsSchemas[orgName] = mongoose.Schema({
            CompanyName: { type: String },
            EmpStatus: { type: Number },
            EmpEmail: { type: Number },
            EmpInfo: { type: Number },
            AllowOvertime: { type: Number },
            RecordOvertime: { type: Number },
            ToilLeaveApproval: { type: Number },
            AbsenceConflict: { type: Number },
            AnnualLeaveCarryOver: { type: Number },
            EmpLeaveCancel: { type: Number },
            RotasPermissions: { type: Number },
            HideLabelForEmp: { type: Number }
        })
    }
    return OrganizationSettingsSchemas[orgName];
}

const OrganizationSettingsModels = {};

function getOrganizationSettingsModel(orgName) {
    if (!OrganizationSettingsModels[orgName]) {
        OrganizationSettingsModels[orgName] = mongoose.model(`${orgName}_Settings`, getOrganizationSettingsSchema(orgName));
    }
    return OrganizationSettingsModels[orgName];
}

const OrgSettingsValidation = Joi.object().keys({
    _id: Joi.optional(),
    CompanyName: Joi.string()
        .max(100)
        .required(),
    EmpStatus: Joi.number()
        .max(2)
        .required(),
    EmpEmail: Joi.number()
        .max(2)
        .required(),
    EmpInfo: Joi.number()
        .max(2)
        .required(),
    AllowOvertime: Joi.number()
        .max(2)
        .required(),
    RecordOvertime: Joi.number()
        .max(2)
        .required(),
    ToilLeaveApproval: Joi.number()
        .max(2)
        .required(),
    AbsenceConflict: Joi.number()
        .max(2)
        .required(),
    AnnualLeaveCarryOver: Joi.number()
        .max(2)
        .required(),
    EmpLeaveCancel: Joi.number()
        .max(2)
        .required(),
    RotasPermissions: Joi.number()
        .max(2)
        .required(),
    HideLabelForEmp: Joi.number()
        .max(2)
        .required()
});

module.exports = { getOrganizationSettingsModel, OrgSettingsValidation }