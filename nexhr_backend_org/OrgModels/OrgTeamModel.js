const mongoose = require("mongoose");

const OrgTeamSchemas = {};
function getTeamSchema(orgName) {
    if (!OrgTeamSchemas[orgName]) {
        OrgTeamSchemas[orgName] = mongoose.Schema({
            teamName: {
                type: String,
                unique: true
            },
            employees: [{ type: mongoose.Types.ObjectId, ref: `${orgName}Employee` }],
            lead: {
                type: mongoose.Types.ObjectId, ref: `${orgName}Employee`
            }
        })
    }
    return OrgTeamSchemas[orgName];
}

const OrgTeamModels = {};
function getTeamModel(orgName) {
    if (!OrgTeamModels[orgName]) {
        OrgTeamModels[orgName] = mongoose.model(`${orgName}Team`, getTeamSchema(orgName))
    }
}


const TeamValidation = Joi.object({
    teamName: Joi.string().required(),
    employees: Joi.array().items(Joi.objectId()).required(),
    lead: Joi.string().required()
})

module.exports = { getTeamModel, TeamValidation }