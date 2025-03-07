const mongoose = require("mongoose");
const Joi = require("joi");

const TrackerSchema = new mongoose.Schema({
    date: { type: Date },
    message: { type: String },
    who: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null }
}, { _id: false })

const spendTimeSchema = new mongoose.Schema({
    startingTime: [{ type: String }],
    endingTime: [{ type: String }],
    timeHolder: { type: String },
    reasonForLate: { type: String }
}, { _id: false })

const taskSchema = new mongoose.Schema({
    title: { type: String },
    priority: { type: String },
    attachments: [{ type: String }],
    description: { type: String },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    from: { type: Date },
    to: { type: Date },
    spend: spendTimeSchema,
    status: { type: String },
    trash: { type: Boolean, default: false },
    tracker: [TrackerSchema],
    estTime: { type: Number },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }
}, { timestamps: true })

const Task = mongoose.model("Task", taskSchema);

const taskValidation = Joi.object({
    _id: Joi.string().allow("").label('_id'),
    __v: Joi.string().allow(0).label('__v'),
    title: Joi.string().required().label('Task Title'),
    priority: Joi.string()
        .valid('Low', 'Medium', 'High', 'Critical')
        .required()
        .label('Priority'),
    attachments: Joi.array()
        .items(Joi.string().label('Attachment URL'))
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
    createdby: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .label('Created By'),
    tracker: Joi.any().label("Tracker"),
    estTime: Joi.any().label("EstTime"),
    spend: Joi.any().label("Spend"),
    trash: Joi.boolean().allow("", null).label("Trash"),
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Project ID'),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt')
});

module.exports = {
    taskValidation,
    Task
}