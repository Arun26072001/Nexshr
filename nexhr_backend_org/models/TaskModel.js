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
    timeHolder: { type: String, default: "00:00:00" },
    reasonForLate: { type: String }
}, { _id: false })

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
    createdAt: Joi.any().optional().label('createdAt'),
    updatedAt: Joi.any().optional().label('updatedAt'),
    company: Joi.any().optional().label('company'),
    title: Joi.string().required().disallow(null, ' ', 'none', 'undefined').label('title'),
    priority: Joi.string()
        .valid('Low', 'Medium', 'High', 'Critical')
        .required()
        .label('priority'),
    subTask: Joi.any().optional().label('subTask'),
    remind: Joi.any().optional().label('remind'),
    dependantTasks: Joi.any().optional().label('dependantTasks'),
    observers: Joi.any().optional().label('observers'),
    participants: Joi.any().optional().label('participants'),
    attachments: Joi.array()
        .items(Joi.string().label('attachments'))
        .label('attachments'),
    description: Joi.string().allow('').label('description'),
    assignedTo: Joi.array().min(1)
        .items(Joi.any())
        .required()
        .label('assignedTo'),
    from: Joi.date().required().label('from'),
    to: Joi.date()
        .greater(Joi.ref('from'))
        .required()
        .label('to')
        .messages({ "date.min": "'to' must be greater than 'from'" }),
    status: Joi.string()
        .valid('Pending', 'In Progress', 'Completed', 'On Hold')
        .required()
        .label('status'),
    createdby: Joi.any().optional().label('createdby'),
    tags: Joi.array().items(Joi.string()).optional().label('tags'),
    tracker: Joi.any().label('tracker'),
    estTime: Joi.number().required().label('estTime'),
    spend: Joi.any().label('spend'),
    comments: Joi.array().items(Joi.string()).label('comments'),
    isDeleted: Joi.boolean().allow("", null).label('isDeleted'),
    category: Joi.any().optional().label('category'),
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().label('project'),
});

module.exports = {
    taskValidation,
    Task,
    taskSchema
}