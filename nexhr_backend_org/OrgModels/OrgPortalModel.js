const mongoose = require('mongoose');
const Joi = require('joi');

const OrgProtalsSchemas = {}

function getPortalSchema(orgName) {
    if (!OrgProtalsSchemas[orgName]) {
        OrgProtalsSchemas[orgName] = new mongoose.Schema({
            CreatedBy: { type: String },
            CreatedDate: { type: Date, default: Date.now },
            Deleted: { type: Boolean },
            ModifiedBy: { type: String },
            ModifiedDate: { type: Date },
            PortalName: { type: String, required: true },
            Status: { type: Number, required: true }
        });
    }
    return OrgProtalsSchemas[orgName];
}

const OrgProtalModels = {}

function getOrgPortalModel(orgName) {
    if(!OrgProtalModels[orgName]){
        OrgProtalsSchemas[orgName] = mongoose.model(`${orgName}_Portal`, getPortalSchema(orgName))
    }
}

const PortalValidation = Joi.object().keys({
    _id: Joi.optional(),
    ID: Joi.optional(),
    CreatedBy: Joi.optional(),
    CreatedDate: Joi.optional(),
    Deleted: Joi.optional(),
    ModifiedBy: Joi.optional(),
    ModifiedDate: Joi.optional(),
    PortalName: Joi.string()
        .max(200)
        .required(),
    Status: Joi.number()
        .max(1)
        .required()
});

module.exports = {
    getOrgPortalModel, PortalValidation
};