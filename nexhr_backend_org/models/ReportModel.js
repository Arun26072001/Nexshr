const mongoose = require("mongoose");
const Joi = require("joi");

const reportSchema = new mongoose.Schema({
    name: { type: String },
    // department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    date: { type: Date, default: new Date() },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    description: { type: String },
    attachments: [{ type: String, default: [] }],
    isDeleted: { type: Boolean, default: false },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true })

const Report = mongoose.model("Report", reportSchema);

const ReportValidation = Joi.object({
    _id: Joi.string().allow('').label('_id'),
    __v: Joi.string().allow(0).label('__v'),
    name: Joi.string().disallow(null, ' ', 'none', 'undefined').required(), // Name is a required string
    date: Joi.any().optional(),
    task: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    attachments: Joi.array().items(Joi.string()).optional(),
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Must be a valid ObjectId
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Optional ObjectId
    employees: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .required(), // Array of ObjectIds
    isDeleted: Joi.any().label("Trash"),
    description: Joi.string().required(),
    createdby: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
});

module.exports = {
    Report, ReportValidation, reportSchema
}