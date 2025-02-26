const mongoose = require('mongoose');
const Joi = require('joi');

var projectSchema = new mongoose.Schema({
  name: { type: String },
  prefix: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  color: { type: String },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task", default: [] }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report", default: [] }],
  description: { type: String },
  trash: { type: Boolean, default: false },
  status: { type: String },
  estCost: { type: String },
  estTime: { type: String },
  priority: { type: String },
  tracker: [{ type: mongoose.Schema.Types.Mixed, default: {} }],
  createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
}, { timestamps: true });

var Project = mongoose.model("Project", projectSchema);

const projectValidation = Joi.object({
  name: Joi.string().required().label('Project Name'),
  prefix: Joi.string().required().label('Project Prefix'),
  company: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('Company ID'),
  employees: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'))
    .label('Employees'),
  color: Joi.string()
    .label('Color'), // Hex color validation
  tasks: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Task ID'))
    .label('Tasks'),
  reports: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Report ID').optional())
    .label('Tasks'),
  description: Joi.string().allow('').label('Description'),
  status: Joi.string()
    .valid('Not Started', 'In Progress', 'Completed', 'On Hold')
    .required()
    .label('Status'),
  estCost: Joi.string().allow('').label('Estimated Cost'), // Can be enhanced if a numeric value is expected
  estTime: Joi.string().allow('').label('Estimated Time'), // Can also be refined for specific time formats
  priority: Joi.string()
    .valid('Low', 'Medium', 'High', 'Critical')
    .required()
    .label('Priority'),
  createdby: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('Created By'),
  tracker: Joi.object().allow({}).label("Tracker"),
  trash: Joi.boolean().allow("", null).label("Trash"),
  createdAt: Joi.string().allow('').label('createdAt'),
  updatedAt: Joi.string().allow('').label('updatedAt')
});

module.exports = {
  Project, projectValidation, projectSchema
};