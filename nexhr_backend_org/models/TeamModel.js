const mongoose = require("mongoose");
const Joi = require("joi");

const TeamSchema = mongoose.Schema({
    teamName: {
        type: String,
        unique: true
    },
    employees: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    lead: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    head: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    manager: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }]
}, { timestamps: true })

const Team = mongoose.model("Team", TeamSchema);

const TeamValidation = Joi.object({
    _id: Joi.string().optional(),
    teamName: Joi.string().required().label("Team Name"),
    employees: Joi.array().items(Joi.string()).required().label("Employees"),
    lead: Joi.array().items(Joi.string()).optional().label("Lead"),
    head: Joi.array().items(Joi.string()).optional().label("Head"),
    manager: Joi.array().items(Joi.string()).optional().label("Manager"),
    __v: Joi.number().optional(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
})

module.exports = {
    Team,
    TeamValidation,
    TeamSchema
}