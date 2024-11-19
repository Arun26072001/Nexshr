const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);

const TeamSchema = mongoose.Schema({
    teamName: {
        type: String,
        unique: true
    },
    employees: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    lead: {
        type: mongoose.Types.ObjectId, ref: "Employee"
    }
})

const Team = mongoose.model("Team", TeamSchema);

const TeamValidation = Joi.object({
    teamName: Joi.string().required(),
    employees: Joi.array().items(Joi.objectId()).required(),
    lead: Joi.string().required()
})

module.exports = {
    Team, 
    TeamValidation,
    TeamSchema
}

// module.exports.AddNewTeamCollection = function(orgName) {
//     return mongoose.model(orgName+"Team", TeamSchema)
//   }