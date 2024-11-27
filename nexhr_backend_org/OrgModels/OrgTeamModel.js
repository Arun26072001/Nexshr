const mongoose = require("mongoose");
const Joi = require("joi");

const OrgTeamSchemas = {};

function getTeamSchema(orgName) {
    if (!OrgTeamSchemas[orgName]) {
        OrgTeamSchemas[orgName] = mongoose.Schema({
            teamName: {
                type: String,
                unique: true
            },
            employees: [{ type: mongoose.Types.ObjectId, ref: `${orgName}_Employee` }],
            lead: {
                type: mongoose.Types.ObjectId, ref: `${orgName}_Employee`
            }
        })
    }
    return OrgTeamSchemas[orgName];
}

const OrgTeamModels = {};
function getTeamModel(orgName) {
    if (!OrgTeamModels[orgName]) {
        OrgTeamModels[orgName] = mongoose.model(`${orgName}_Team`, getTeamSchema(orgName))
    }
}


const TeamValidation = Joi.object({
    teamName: Joi.string().required(),
    employees: Joi.array().items(Joi.string()).required(),
    lead: Joi.string().required()
})

module.exports = { getTeamModel, TeamValidation }