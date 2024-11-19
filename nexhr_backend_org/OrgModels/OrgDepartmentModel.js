
const Joi = require("joi")
const mongoose = require("mongoose");

const OrgDepartmentSchemas = {};
function getDepartmentSchema(orgName) {
    if (!OrgDepartmentSchemas[orgName]) {
        OrgDepartmentSchemas[orgName] = new mongoose.Schema({
            DepartmentName: { type: String, required: true },
            orgId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Org" }]
        })
    }
    return OrgDepartmentSchemas[orgName];
}

const OrgDepartmentModels = {};

function getDepartmentModel(orgName) {
    if (!OrgDepartmentModels[orgName]) {
        OrgDepartmentModels[orgName] = mongoose.model(`${orgName}_Department`, getDepartmentSchema(orgName))
    }
    return OrgDepartmentModels[orgName];
}

const DepartmentValidation = Joi.object().keys({
    DepartmentName: Joi.string()
        .max(200)
        .required(),
    orgId: Joi.required()
});

module.exports = { getDepartmentModel, DepartmentValidation }