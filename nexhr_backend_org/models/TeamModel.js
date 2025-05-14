const mongoose = require("mongoose");
const Joi = require("joi");

const TeamSchema = mongoose.Schema({
    teamName: {
        type: String,
        unique: true
    },
    hr: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    admin: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    employees: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    lead: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    head: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    manager: [{
        type: mongoose.Types.ObjectId, ref: "Employee"
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true })

const Team = mongoose.model("Team", TeamSchema);

const TeamValidation = Joi.object({
    _id: Joi.string().optional(),
    teamName: Joi.string().required().label("Team Name"),
    employees: Joi.array().items(Joi.string()).required().label("Employees"),
    lead: Joi.array().items(Joi.string()).optional().label("Lead"),
    head: Joi.array().items(Joi.string()).optional().label("Head"),
    manager: Joi.array().items(Joi.string()).optional().label("Manager"),
    admin: Joi.array().items(Joi.string()).optional().label("Admin"),
    hr: Joi.array().items(Joi.string()).optional().label("Hr"),
    __v: Joi.number().optional(),
    createdBy: Joi.any().optional(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
})

module.exports = {
    Team,
    TeamValidation,
    TeamSchema
}