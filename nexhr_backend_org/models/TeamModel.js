const mongoose = require("mongoose");
const Joi = require("joi");

const TeamSchema = mongoose.Schema({
    teamName: {
        type: String,
        unique: true
    },
     isDeleted: {type: Boolean, default: false},
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
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
    teamName: Joi.string().required().disallow(null, '', 'none', 'undefined').label("TeamName"),
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    employees: Joi.array().items(Joi.string()).required().label("employees"),
    lead: Joi.array().items(Joi.string()).required().label("lead"),
    head: Joi.array().items(Joi.string()).optional().label("head"),
    manager: Joi.array().items(Joi.string()).optional().label("manager"),
    admin: Joi.array().items(Joi.string()).optional().label("admin"),
    hr: Joi.array().items(Joi.string()).required().label("hr"),
    __v: Joi.any().optional(),
    isDeleted: Joi.any().optional(),
    createdBy: Joi.any().optional(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
})

module.exports = {
    Team,
    TeamValidation,
    TeamSchema
}