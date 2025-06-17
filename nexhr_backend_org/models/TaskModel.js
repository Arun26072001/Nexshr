const mongoose = require("mongoose");
const Joi = require("joi");
const schedule = require("node-schedule");
const { Employee } = require("./EmpModel");
const { sendPushNotification } = require("../auth/PushNotification");
const sendMail = require("../routes/mailSender");

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

const commentSchema = new mongoose.Schema({
    comment: { type: String },
    attachments: [{ type: String }],
    spend: { type: String, default: 0 },
    date: { type: Date, default: new Date() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

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
    spend: { type: spendTimeSchema, default: () => ({}) },
    status: { type: String },
    trash: { type: Boolean, default: false },
    tracker: [{ type: TrackerSchema }],
    comments: [{ type: commentSchema, default: null }],
    estTime: { type: Number },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    category: {type: mongoose.Schema.Types.ObjectId, ref: "PlannerCategory"}
}, { timestamps: true })

taskSchema.post("save", async function (doc) {
    const task = doc.toObject();
    const { remind = [], createdby, assignedTo } = task;
    let [creator, assignees] = await Promise.all([
        Employee.findById(createdby, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo"),
        Employee.find({ _id: { $in: assignedTo } }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo")
    ])

    if (!Array.isArray(remind) || remind.length === 0) return;

    remind.forEach((reminder) => {
        const reminderDate = new Date(reminder.on);
        if (reminderDate <= new Date()) return; // Skip past reminders

        schedule.scheduleJob(reminderDate, async () => {

            const title = "Task Reminder Notification";
            const message = `You have a task reminder: ${task.title}`;

            // Fetch full creator & assignees if needed here using Task.populate()

            if (["Creator", "Self"].includes(reminder.for)) {
                if (creator?.fcmToken) {
                    await sendPushNotification({
                        token: creator.fcmToken,
                        title,
                        body: message,
                        // company: creator.company
                    });
                }

                await sendMail({
                    From:`<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: creator.Email,
                    Subject: title,
                    TextBody: message
                });
            } else {
                const employees = Array.isArray(assignees) ? assignees : [assignees];

                for (const emp of employees) {
                    if (!emp?.Email) continue;

                    if (emp.fcmToken) {
                        await sendPushNotification({
                            token: emp.fcmToken,
                            title,
                            body: message,
                            // company: emp.company || creator.company
                        });
                    }

                    await sendMail({
                        From: `<${creator.Email}> (Nexshr)`,
                        To: emp.Email,
                        Subject: title,
                        TextBody: message
                    });
                }
            }
        });
    });
});

taskSchema.post("findOneAndUpdate", async function (doc) {
    const task = doc.toObject();
    const { remind = [], createdby, assignedTo } = task;
    let [creator, assignees] = await Promise.all([
        Employee.findById(createdby, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo"),
        Employee.find({ _id: { $in: assignedTo } }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo")
    ])

    if (!Array.isArray(remind) || remind.length === 0) return;

    remind.forEach((reminder) => {
        const reminderDate = new Date(reminder.on);
        if (reminderDate <= new Date()) return; // Skip past reminders

        schedule.scheduleJob(reminderDate, async () => {

            const title = "Task Reminder Notification";
            const message = `You have a task reminder: ${task.title}`;

            // Fetch full creator & assignees if needed here using Task.populate()

            if (["Creator", "Self"].includes(reminder.for)) {
                if (creator?.fcmToken) {
                    await sendPushNotification({
                        token: creator.fcmToken,
                        title,
                        body: message,
                        // company: creator.company
                    });
                }

                await sendMail({
                    From: `<${process.env.FROM_MAIL}> (Nexshr)`,
                    To: creator.Email,
                    Subject: title,
                    TextBody: message
                });
            } else {
                const employees = Array.isArray(assignees) ? assignees : [assignees];

                for (const emp of employees) {
                    if (!emp?.Email) continue;

                    if (emp.fcmToken) {
                        await sendPushNotification({
                            token: emp.fcmToken,
                            title,
                            body: message
                        });
                    }

                    await sendMail({
                        From: `<${creator.Email}> (Nexshr)`,
                        To: emp.Email,
                        Subject: title,
                        TextBody: message
                    });
                }
            }
        });
    });
});

const Task = mongoose.model("Task", taskSchema);

const taskValidation = Joi.object({
    _id: Joi.string().allow("").label('_id'),
    __v: Joi.string().allow(0).label('__v'),
    createdAt: Joi.string().allow('').label('createdAt'),
    updatedAt: Joi.string().allow('').label('updatedAt'),
    title: Joi.string().required().disallow(null, '', 'none', 'undefined').label('Task Title'),
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
    description: Joi.string().allow('').label('Description'),
    assignedTo: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'))
        .required()
        .label('Assigned To'),
    from: Joi.date().required().label('Start Date'),
    to: Joi.date()
        .greater(Joi.ref('from'))
        .required()
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
    estTime: Joi.any().required().label("EstTime"),
    spend: Joi.any().label("Spend"),
    comments: Joi.any().label("Comments"),
    trash: Joi.boolean().allow("", null).label("Trash"),
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().label('Project ID'),
});

module.exports = {
    taskValidation,
    Task,
    taskSchema
}