const mongoose = require("mongoose");
const Joi = require("joi");

const taskSchema = new mongoose.Schema({
    title: { type: String },
    priority: { type: String },
    attachments: [{ type: String }],
    description: { type: String },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "employee" }],
    from: { type: Date },
    to: { type: Date },
    status: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" }
}, { timestamps: true })

const Task = mongoose.model("tasks", taskSchema);

const taskValidation = Joi.object({
    title: Joi.string().required().label('Task Title'),
    priority: Joi.string()
        .valid('Low', 'Medium', 'High', 'Critical')
        .required()
        .label('Priority'),
    attachments: Joi.array()
        .items(Joi.string().uri().label('Attachment URL'))
        .label('Attachments'),
    description: Joi.string().allow('').label('Description'),
    assignedTo: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'))
        .label('Assigned To'),
    from: Joi.date().optional().label('Start Date'),
    to: Joi.date()
        .greater(Joi.ref('from'))
        .optional()
        .label('End Date'),
    status: Joi.string()
        .valid('Pending', 'In Progress', 'Completed', 'On Hold')
        .required()
        .label('Status'),
    createdBy: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .label('Created By'),
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Project ID')
});

module.exports = {
    taskValidation,
    Task
}