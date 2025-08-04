
module.exports = function taskSchemaUpdate(taskSchema) {
    const { sendPushNotification } = require("../auth/PushNotification");
    const { Employee } = require("../models/EmpModel");
    const sendMail = require("../routes/mailSender");

    taskSchema.post("save", async function (doc) {
        const task = doc.toObject();
        const { remind = [], createdby, assignedTo } = task;
        let [creator, assignees] = await Promise.all([
            Employee.findById(createdby, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo"),
            Employee.find({ _id: { $in: assignedTo }, isDeleted: false }, "FirstName LastName Email fcmToken company").populate("company", "CompanyName logo")
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
}