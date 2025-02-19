const mongoose = require("mongoose");
const Joi = require("joi");

const TeamSchema = mongoose.Schema({
    teamName: {
        type: String,
        unique: true
    },
    employees: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    lead: {
        type: mongoose.Types.ObjectId, ref: "Employee"
    },
    head: {
        type: mongoose.Types.ObjectId, ref: "Employee"
    },
    manager: {
        type: mongoose.Types.ObjectId, ref: "Employee"
    }
}, { timestamps: true })

const Team = mongoose.model("Team", TeamSchema);

const TeamValidation = Joi.object({
    teamName: Joi.string().required(),
    employees: Joi.array().items(Joi.string()).required(),
    lead: Joi.string().required(),
    head: Joi.string().required()
})

module.exports = {
    Team,
    TeamValidation,
    TeamSchema
}

// module.exports.AddNewTeamCollection = function(orgName) {
//     return mongoose.model(orgName+"Team", TeamSchema)
//   }