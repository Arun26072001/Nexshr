const mongoose = require("mongoose");
const Joi = require("joi");

const reportSchema = new mongoose.Schema({
    name: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    startDate: { type: Date },
    endDate: { type: Date },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    trash: { type: Boolean, default: false },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true })

const Report = mongoose.model("Report", reportSchema);

const ReportValidation = Joi.object({
    _id: Joi.string().allow('').label('_id'),
    __v: Joi.string().allow(0).label('__v'),
    name: Joi.string().required(), // Name is a required string
    department: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Must be a valid ObjectId
    startDate: Joi.date().required(), // Must be a valid date
    endDate: Joi.date().greater(Joi.ref("startDate")).required(), // Must be a valid date and later than startDate
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Must be a valid ObjectId
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // Optional ObjectId
    employees: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .required(), // Array of ObjectIds
    trash: Joi.any().label("Trash"),
    createdby: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
});

module.exports = {
    Report, ReportValidation
}