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
}, { _id: false, timestamps: true })

const taskSchema = new mongoose.Schema({
    title: { type: String },
    priority: { type: String },
    attachments: [{ type: String }],
    description: { type: String },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    observers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    dependantTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    remind: [{ type: mongoose.Schema.Types.Mixed, default: {} }],
    subTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    crm: { type: String },
    tags: [{ type: String }],
    from: { type: Date },
    to: { type: Date },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    spend: { type: spendTimeSchema, default: () => ({}) },
    status: { type: String },
    isDeleted: { type: Boolean, default: false },
    tracker: [{ type: TrackerSchema }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] }],
    estTime: { type: Number },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "PlannerCategory" }
}, { timestamps: true })

require("../ModelChangeEvents/taskHooks")(taskSchema)

const Task = mongoose.model("Task", taskSchema);

const taskValidation = Joi.object({
    _id: Joi.string().allow("").label('_id'),
    __v: Joi.string().allow(0).label('__v'),
    createdAt: Joi.any().optional(),
    updatedAt: Joi.any().optional(),
    company: Joi.any().optional(),
    title: Joi.string().required().disallow(null, ' ', 'none', 'undefined').label('Title'),
    priority: Joi.string()
        .valid('Low', 'Medium', 'High', 'Critical')
        .required()
        .label('Priority'),
    subTask: Joi.any().optional(),
    remind: Joi.any().optional(),
    dependantTasks: Joi.any().optional(),
    observers: Joi.any().optional(),
    participants: Joi.any().optional(),
    attachments: Joi.array()
        .items(Joi.string().label('Attachment URL'))
        .label('Attachments'),
    description: Joi.string().allow('').label('description'),
    assignedTo: Joi.array().min(1)
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'))
        .required()
        .label('assignedTo'),
    from: Joi.date().required().label('from Date'),
    to: Joi.date()
        .greater(Joi.ref('from'))
        .required()
        .label('to Date')
        .messages({ "date.min": "'To' Date must be greater than 'From' Date" }),
    status: Joi.string()
        .valid('Pending', 'In Progress', 'Completed', 'On Hold')
        .required()
        .label('Status'),
    createdby: Joi.any()
        .optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    tracker: Joi.any().label("Tracker"),
    estTime: Joi.any().required().label("EstTime"),
    spend: Joi.any().label("Spend"),
    comments: Joi.array().items(Joi.string()).label("Comments"),
    isDeleted: Joi.boolean().allow("", null).label("Trash"),
    category: Joi.any().optional(),
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().label('Project ID'),
});

module.exports = {
    taskValidation,
    Task,
    taskSchema
}