const { getNotificationSettings } = require("../services/NotificationService");

module.exports = function taskSchemaUpdate(taskSchema) {
    const { pushNotification, sendMail } = require("../Reuseable_functions/notifyFunction");
    const { Employee } = require("../models/EmpModel");
    const schedule = require("node-schedule");

    const scheduleTaskDeadline = (task, creator, assignees) => {
        try {
            const deadline = new Date(task.to);
            if (!(deadline instanceof Date) || isNaN(deadline)) return; // invalid
            if (deadline <= new Date()) return; // past deadline
            const { taskManagement } = getNotificationSettings(creator.company._id);
            if (taskManagement.deadlineReminders) {
                schedule.scheduleJob(deadline, async () => {
                    const title = "Task Deadline Reminder";
                    const message = `Task "${task.title}" has reached its deadline.`;

                    // Notify creator
                    if (creator?.Email) {
                        if (creator?.fcmToken) {
                            await pushNotification(
                                creator.company?._id,
                                "task",
                                "taskDeadline",
                                {
                                    tokens: creator.fcmToken,
                                    title,
                                    body: message
                                }
                            );
                        }

                        await sendMail(
                            creator.company?._id,
                            "task",
                            "taskDeadline",
                            {
                                to: creator.Email,
                                subject: title,
                                text: message,
                                from: `<${process.env.FROM_MAIL}> (Nexshr)`
                            }
                        );
                    }

                    // Notify assignees
                    const employees = Array.isArray(assignees) ? assignees : (assignees ? [assignees] : []);
                    for (const emp of employees) {
                        if (!emp?.Email) continue;

                        if (emp.fcmToken) {
                            await pushNotification(
                                emp.company?._id || creator?.company?._id,
                                "task",
                                "taskDeadline",
                                {
                                    tokens: emp.fcmToken,
                                    title,
                                    body: message
                                }
                            );
                        }

                        await sendMail(
                            emp.company?._id || creator?.company?._id,
                            "task",
                            "taskDeadline",
                            {
                                to: emp.Email,
                                subject: title,
                                text: message,
                                from: `<${creator?.Email || process.env.FROM_MAIL}> (Nexshr)`
                            }
                        );
                    }
                });
            }
        } catch (e) {
            // fail safe: do not crash hook
        }
    };

    taskSchema.post("save", async function (doc) {
        const task = doc.toObject();
        const { remind = [], createdby, assignedTo } = task;
        let [creator, assignees] = await Promise.all([
            Employee.findById(createdby, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo"),
            Employee.find({ _id: { $in: assignedTo }, isDeleted: false }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo")
        ])

        // Schedule custom reminders if provided
        if (Array.isArray(remind) && remind.length > 0) {
            remind.forEach((reminder) => {
                const reminderDate = new Date(reminder.on);
                if (reminderDate <= new Date()) return; // Skip past reminders

                schedule.scheduleJob(reminderDate, async () => {

                    const title = "Task Reminder Notification";
                    const message = `You have a task reminder: ${task.title}`;

                    // Fetch full creator & assignees if needed here using Task.populate()

                    if (["Creator", "Self"].includes(reminder.for)) {
                        if (creator?.fcmToken) {
                            await pushNotification(
                                creator.company._id,
                                "task",
                                "taskReminder",
                                {
                                    tokens: creator.fcmToken,
                                    title,
                                    body: message
                                }
                            );
                        }

                        await sendMail(
                            creator.company._id,
                            "task",
                            "taskReminder",
                            {
                                to: creator.Email,
                                subject: title,
                                text: message,
                                from: `<${process.env.FROM_MAIL}> (Nexshr)`
                            }
                        );
                    } else {
                        const employees = Array.isArray(assignees) ? assignees : [assignees];

                        for (const emp of employees) {
                            if (!emp?.Email) continue;

                            if (emp.fcmToken) {
                                await pushNotification(
                                    emp.company._id || creator.company._id,
                                    "task",
                                    "taskReminder",
                                    {
                                        tokens: emp.fcmToken,
                                        title,
                                        body: message
                                    }
                                );
                            }

                            await sendMail(
                                emp.company._id || creator.company._id,
                                "task",
                                "taskReminder",
                                {
                                    to: emp.Email,
                                    subject: title,
                                    text: message,
                                    from: `<${creator.Email}> (Nexshr)`
                                }
                            );
                        }
                    }
                });
            });
        }

        // Always schedule a deadline reminder based on task.to
        scheduleTaskDeadline(task, creator, assignees);
    });

    taskSchema.post("findOneAndUpdate", async function (doc) {
        const task = doc.toObject();
        const { remind = [], createdby, assignedTo } = task;
        let [creator, assignees] = await Promise.all([
            Employee.findById(createdby, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo"),
            Employee.find({ _id: { $in: assignedTo } }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo")
        ])

        // Schedule custom reminders if provided
        if (Array.isArray(remind) && remind.length > 0) {
            remind.forEach((reminder) => {
                const reminderDate = new Date(reminder.on);
                if (reminderDate <= new Date()) return; // Skip past reminders

                schedule.scheduleJob(reminderDate, async () => {

                    const title = "Task Reminder Notification";
                    const message = `You have a task reminder: ${task.title}`;

                    // Fetch full creator & assignees if needed here using Task.populate()

                    if (["Creator", "Self"].includes(reminder.for)) {
                        if (creator?.fcmToken) {
                            await pushNotification(
                                creator.company._id,
                                "task",
                                "taskReminder",
                                {
                                    tokens: creator.fcmToken,
                                    title,
                                    body: message
                                }
                            );
                        }

                        await sendMail(
                            creator.company._id,
                            "task",
                            "taskReminder",
                            {
                                to: creator.Email,
                                subject: title,
                                text: message,
                                from: `<${process.env.FROM_MAIL}> (Nexshr)`
                            }
                        );
                    } else {
                        const employees = Array.isArray(assignees) ? assignees : [assignees];

                        for (const emp of employees) {
                            if (!emp?.Email) continue;

                            if (emp.fcmToken) {
                                await pushNotification(
                                    emp.company._id || creator.company._id,
                                    "task",
                                    "taskReminder",
                                    {
                                        tokens: emp.fcmToken,
                                        title,
                                        body: message
                                    }
                                );
                            }

                            await sendMail(
                                emp.company._id || creator.company._id,
                                "task",
                                "taskReminder",
                                {
                                    to: emp.Email,
                                    subject: title,
                                    text: message,
                                    from: `<${creator.Email}> (Nexshr)`
                                }
                            );
                        }
                    }
                });
            });
        }

        // Always schedule a deadline reminder based on task.to
        scheduleTaskDeadline(task, creator, assignees);
    });
}
