const mongoose = require("mongoose");
const Joi = require("joi");
const OrgPositionSchemas = {}; // Store Position schemas for each organization

function getPositionSchema(orgName) {
    if (!OrgPositionSchemas[orgName]) {
        OrgPositionSchemas[orgName] = new mongoose.Schema({
            PositionName: { type: String, required: true }, // Name of the position
            orgId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Org" }] // Reference to the organization
        });
    }
    return OrgPositionSchemas[orgName];
}

const OrgPositionModels = {}; // Store Position models for each organization

function getPositionModel(orgName) {
    if (!OrgPositionModels[orgName]) {
        OrgPositionModels[orgName] = mongoose.model(
            `${orgName}_Position`, // Dynamic collection name for Position
            getPositionSchema(orgName)
        );
    }
    return OrgPositionModels[orgName];
}

const PositionValidation = Joi.object().keys({
    PositionName: Joi.string()
        .max(200)
        .required(),
    org: Joi.required()
});

module.exports = { getPositionModel, PositionValidation };
