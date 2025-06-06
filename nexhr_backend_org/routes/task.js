const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Task, taskValidation } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { convertToString, getCurrentTimeInMinutes, timeToMinutes, formatTimeFromMinutes, projectMailContent, categorizeTasks } = require("../Reuseable_functions/reusableFunction");
const { sendPushNotification } = require("../auth/PushNotification");
const { PlannerCategory } = require("../models/PlannerCategoryModel");
const { PlannerType } = require("../models/PlannerTypeModel");
const router = express.Router();

router.get("/project/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        let tasks = await Task.find({ project: { $in: req.params.id } }, "-tracker")
            .populate({ path: "project", select: "name color" })
            .populate({ path: "assignedTo", select: "FirstName LastName" })
            .exec();
        if (tasks.length === 0) {
            return res.status(200).send({ tasks: [] })
        }
        const timeUpdatedTasks = tasks.map((task) => {
            if (!task?.spend) return task; // Ensure spend exists

            let { startingTime: startingTimes, endingTime: endingTimes } = task.spend;

            if (!Array.isArray(startingTimes) || startingTimes.length === 0) {

                let totalCommentSpendTime = 0;
                task?.comments?.map((comment) => totalCommentSpendTime += Number(comment.spend));

                return {
                    ...task.toObject(),
                    spend: {
                        ...(task.spend ? task.spend.toObject() : {}), // Ensure spend exists
                        timeHolder: task?.spend?.timeHolder?.split(/[:.]+/)?.length === 2 && ["00:00:00"].includes(task.spend?.timeHolder) ? formatTimeFromMinutes(
                            (Number(task.spend?.timeHolder) + totalCommentSpendTime) * 60
                        ) : task.spend.timeHolder
                    }
                };
            }

            const values = startingTimes.map((startTime, index) => {
                if (!startTime) return 0; // No start time means no value

                const startTimeInMin = timeToMinutes(startTime);
                const endTimeInMin = (endingTimes?.[index]) ? timeToMinutes(endingTimes[index]) : getCurrentTimeInMinutes();

                return Math.abs(endTimeInMin - startTimeInMin);
            });

            const totalMinutes = values.reduce((acc, value) => acc + value, 0);
            const timeHolder = formatTimeFromMinutes(totalMinutes);

            return {
                ...task.toObject(),
                spend: {
                    ...task.spend.toObject(),
                    timeHolder
                }
            };
        }).filter(Boolean);

        return res.send({ tasks: timeUpdatedTasks });
    } catch (error) {
        console.log(error);

        res.status(500).send({ error: error.message })
    }
})

router.get("/assigned/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        let tasks = await Task.find({ assignedTo: { $in: [req.params.id] } }, "-tracker")
            .populate({ path: "project", select: "name color" })
            .populate({ path: "assignedTo", select: "FirstName LastName" })
            .populate({ path: "createdby", select: "FirstName LastName" })
            .exec();
        if (tasks.length === 0) {
            return res.status(200).send({ tasks: [] })
        }
        const timeUpdatedTasks = tasks.map((task) => {
            if (!task?.spend) return task; // Ensure spend exists

            let { startingTime: startingTimes, endingTime: endingTimes } = task.spend;

            if (!Array.isArray(startingTimes) || startingTimes.length === 0) {

                let totalCommentSpendTime = 0;
                task?.comments?.map((comment) => totalCommentSpendTime += Number(comment.spend));

                return {
                    ...task.toObject(),
                    spend: {
                        ...(task.spend ? task.spend.toObject() : {}), // Ensure spend exists
                        timeHolder: task?.spend?.timeHolder?.split(/[:.]+/)?.length === 2 && ["00:00:00"].includes(task.spend?.timeHolder) ? formatTimeFromMinutes(
                            (Number(task.spend?.timeHolder) + totalCommentSpendTime) * 60
                        ) : task.spend.timeHolder
                    }
                };
            }

            const values = startingTimes.map((startTime, index) => {
                if (!startTime) return 0; // No start time means no value

                const startTimeInMin = timeToMinutes(startTime);
                const endTimeInMin = (endingTimes?.[index]) ? timeToMinutes(endingTimes[index]) : getCurrentTimeInMinutes();

                return Math.abs(endTimeInMin - startTimeInMin);
            });

            const totalMinutes = values.reduce((acc, value) => acc + value, 0);
            const timeHolder = formatTimeFromMinutes(totalMinutes);

            return {
                ...task.toObject(),
                spend: {
                    ...task.spend.toObject(),
                    timeHolder
                }
            };
        }).filter(Boolean);
        const result = categorizeTasks(timeUpdatedTasks);
        const planner = {};
        const plannerType = await PlannerType.findOne({ employee: req.params.id }).lean().exec();

        if (plannerType && plannerType._id) {
            tasks.forEach((task) => {
                // Check if task matches the plannerType (based on category or lack of one)
                if (!task.category || (task.category && task.category === plannerType._id.toString())) {
                    if (!planner[plannerType._id]) {
                        planner[plannerType._id] = [];
                    }
                    planner[plannerType._id].push(task);
                }
            });
        }

        return res.send({ tasks: timeUpdatedTasks, categorizeTasks: result, planner });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const { withComments } = req.query;
    try {
        const fields = "FirstName LastName Email profile";
        let query = Task.findById(req.params.id)
            .populate([
                { path: "tracker.who", select: fields },
                { path: "comments.createdBy", select: fields },
                { path: "createdby", select: fields }
            ]);

        if (withComments) {
            query = query.populate("assignedTo", fields);
        }

        let task = await query;
        if (!task) return res.status(404).send({ error: "No Task found" });

        const { spend, comments } = task;
        const { startingTime = [], endingTime = [] } = spend || {};

        const totalTaskTime = startingTime.reduce((total, startTime, index) => {
            if (!startTime) return total;
            const startTimeInMin = timeToMinutes(startTime);
            const endTimeInMin = endingTime[index] ? timeToMinutes(endingTime[index]) : getCurrentTimeInMinutes();
            return total + Math.abs(endTimeInMin - startTimeInMin);
        }, 0);

        const totalCommentSpendTime = (comments || []).reduce((sum, comment) => sum + (comment.isDeleted ? 0 : Number(comment.spend)), 0);
        const totalTime = totalTaskTime + totalCommentSpendTime * 60;

        if (spend) {
            spend.timeHolder = formatTimeFromMinutes(totalTime);
        }

        return res.send({
            ...task.toObject(),
            comments: withComments ? comments.filter(comment => !comment.isDeleted) : []
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});

router.post("/members", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {

        const { dateRange, collegues } = req.body;
        const fromDate = new Date(dateRange[0]);
        const toDate = new Date(dateRange[1]);

        const taskData = await Task.find({ assignedTo: { $in: collegues }, from: { $lte: toDate }, to: { $gte: fromDate } });
        return res.send(taskData)

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
})

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const { title, project: projectId, assignedTo = [], participants = [], observers = [], status, spend } = req.body;

        // Validate uniqueness of task
        if (await Task.exists({ title })) {
            return res.status(400).send({ error: "Task with this title already exists." });
        }

        // Validate creator
        const creator = await Employee.findById(req.params.id).populate("company", "logo CompanyName");
        if (!creator) {
            return res.status(404).send({ error: "Employee (creator) not found." });
        }

        // Validate project (optional)
        let project = null;
        if (projectId) {
            project = await Project.findById(projectId).populate("tasks");
            if (!project) {
                return res.status(404).send({ error: "Project not found." });
            }
        }

        // Final assignedTo list (unique + include creator)
        const finalAssignedTo = Array.from(new Set([...assignedTo, req.params.id]));

        // Fields to fetch
        const empFields = "FirstName LastName Email fcmToken notifications company";
        const companyFields = "CompanyName logo";

        const [assignedEmps, participantEmps, observerEmps] = await Promise.all([
            Employee.find({ _id: { $in: finalAssignedTo } }).populate("company", companyFields).select(empFields),
            Employee.find({ _id: { $in: participants } }).populate("company", companyFields).select(empFields),
            Employee.find({ _id: { $in: observers } }).populate("company", companyFields).select(empFields)
        ]);

        const defaultCategory = await PlannerCategory.findOne().exec();
        // Create Task
        const task = new Task({
            ...req.body,
            createdby: req.params.id,
            assignedTo: finalAssignedTo,
            participants,
            observers,
            status: status || "On Hold",
            spend: spend || {},
            tracker: [],
            category: defaultCategory._id
        });

        // Trackers
        const now = new Date();
        const fullName = `${creator.FirstName} ${creator.LastName}`;

        task.tracker.push({
            date: now,
            message: `New Task (${title}) created by ${fullName}`,
            who: req.params.id
        });

        const roleLogs = [
            { emps: assignedEmps, label: "assigned" },
            { emps: participantEmps, label: "added as Participants" },
            { emps: observerEmps, label: "added as Observers" }
        ];

        for (const { emps, label } of roleLogs) {
            if (emps.length > 0) {
                const names = emps.map(emp => `${emp.FirstName} ${emp.LastName}`).join(", ");
                task.tracker.push({
                    date: now,
                    message: `${names} ${label} by ${fullName}`,
                    who: req.params.id
                });
            }
        }

        await task.save();

        // If task is part of a project, link it
        if (project) {
            project.tasks.push(task._id);
            await project.save();
        }

        // Notify all involved (assigned + participants + observers)
        const notifyGroups = [
            { emps: assignedEmps, role: "assigned" },
            { emps: participantEmps, role: "Participant" },
            { emps: observerEmps, role: "Observer" }
        ];

        const messageBody = "Please review the task and complete it as per the given instructions.";
        const createdPersonName = fullName;

        for (const { emps, role } of notifyGroups) {

            for (const emp of emps) {
                const notification = {
                    company: emp.company._id,
                    title: `You have been added as a ${role} to a task`,
                    message: messageBody
                };

                emp.notifications.push(notification);
                await emp.save();

                // Push Notification
                if (emp.fcmToken) {
                    await sendPushNotification({
                        token: emp.fcmToken,
                        title: notification.title,
                        body: messageBody,
                        company: creator.company
                    });
                }

                // Email Notification
                await sendMail({
                    From: creator.Email,
                    To: emp.Email,
                    Subject: `${createdPersonName} has added you as a ${role} to a task`,
                    HtmlBody: projectMailContent(emp, creator, creator.company, req.body, "task")
                });
            }
        }

        return res.status(201).send({ message: "Task created successfully.", task });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message || "Internal server error" });
    }
});


router.put("/updatedTaskComment/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const { type } = req.query;
    const taskObj = req.body;
    try {
        const assignessId = taskObj.assignedTo.map((member) => member._id);
        const exceptSender = assignessId.filter((emp) => emp !== req.params.id);
        // get employee data for company data
        const emps = await Employee.find({ _id: { $in: exceptSender } }, "FirstName LastName Email fcmToken profile company")
            .populate("company", "CompanyName logo")
            .exec();

        const currentCmt = taskObj.comments.at(-1)
        const commentCreator = await Employee.findById(currentCmt.createdBy, "FirstName LastName")
        // update task with updated comments
        const updatedTask = await Task.findByIdAndUpdate(taskObj._id, taskObj, { new: true });
        if (emps.length) {
            emps.forEach((emp) => {
                const title = `${commentCreator.FirstName + " " + commentCreator.LastName} has commented in ${taskObj.title}`;
                const message = currentCmt.comment.replace(/<\/?[^>]+(>|$)/g, '')
                // send mail 
                sendMail({
                    From: process.env.FROM_MAIL,
                    To: emp.Email,
                    Subject: title,
                    TextBody: message
                })
                // send notification
                sendPushNotification({
                    token: emp.fcmToken,
                    title,
                    body: message,
                    company: emp.company,
                    type
                })
            });
        }
        return res.send({ message: "task comments updated successfully", updatedTask })
    } catch (error) {
        console.log("error in update taskComments", error);
        return res.status(500).send({ error: error.message })
    }
})

router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // Fetch Task Data
        const taskData = await Task.findById(req.params.id);
        if (!taskData) return res.status(404).send({ error: "Task not found" });

        // Identify Newly Assigned Employees
        const newAssignees = req.body?.assignedTo?.filter(emp => !taskData?.assignedTo?.includes(emp)) || [];

        // Fetch Required Employees in Parallel
        const [assignedPerson, empData, emps] = await Promise.all([
            Employee.findById(req.body.createdby).populate("company", "CompanyName logo"),
            Employee.findById(req.params.empId),
            Employee.find({ _id: { $in: newAssignees } }, "FirstName LastName Email fcmToken company notifications")
                .populate("company", "CompanyName logo")
        ]);

        if (!assignedPerson) return res.status(404).send({ error: "Assigned person not found" });
        if (!empData) return res.status(404).send({ error: "Employee not found" });

        // Generate Task Change Logs
        const taskChanges = Object.entries(taskData.toObject()).flatMap(([key, value]) => {
            const newValue = convertToString(req.body[key]);
            const oldValue = convertToString(value);
            if (
                newValue !== undefined &&
                !["createdAt", "createdby", "tracker", "updatedAt", "_id", "__v", "spend", "from", "to", "comments"].includes(key) &&
                (Array.isArray(oldValue) ? oldValue.length !== newValue.length : oldValue !== newValue)
            ) {
                return {
                    date: new Date(),
                    message: `Task field "${key}" updated by ${empData.FirstName} ${empData.LastName} from ${oldValue} to ${newValue}`,
                    who: req.params.empId
                };
            }
            return [];
        });

        // Prepare optional comment update
        let updatedComment = null;
        if (req.query.changeComments && req.body.comments && req.body.comments.length > 0) {
            updatedComment = {
                ...req.body.comments[0],
                createdBy: req.params.empId,
                date: new Date()
            };
        }

        // Ensure proper formatting of creator ID and comments
        const createdById = typeof req.body.createdby === "object" ? req.body.createdby._id : req.body.createdby;
        const updatedComments = req.body.comments?.length === 1 && updatedComment
            ? [...taskData.comments, updatedComment]
            : req.body.comments || taskData.comments;

        // Prepare updated task
        const updatedTask = {
            ...req.body,
            tracker: [...taskData.tracker, ...taskChanges],
            createdby: createdById,
            comments: updatedComments
        };

        // Update Task in DB
        const task = await Task.findByIdAndUpdate(req.params.id, updatedTask, { new: true });
        if (!task) return res.status(404).send({ error: "Failed to update task" });

        const assignedPersonName = `${assignedPerson.FirstName} ${assignedPerson.LastName}`;

        // Send completion emails & notifications if task marked as "Completed"
        if (req.body.status === "Completed") {
            const message = `The task titled "${req.body.title}" has been marked as completed.`;

            await Promise.all(
                emps.map(async emp => {
                    const empName = `${emp.FirstName} ${emp.LastName}`;
                    const notification = {
                        company: emp.company._id,
                        title: `Your assigned task (${req.body.title}) is completed`,
                        message
                    };

                    emp.notifications.push(notification);
                    await emp.save();

                    if (emp.fcmToken) {
                        await sendPushNotification({
                            token: emp.fcmToken,
                            title: notification.title,
                            body: message,
                            company: emp.company
                        });
                    }

                    await sendMail({
                        From: empData.Email,
                        To: assignedPerson.Email,
                        Subject: `Your assigned task (${req.body.title}) is completed`,
                        HtmlBody: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8" /></head>
                <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333;">
                  <div style="text-align: center; padding-top: 30px;">
                    <img src="${assignedPerson.company.logo}" style="width: 100px; height: 100px;" />
                  </div>
                  <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #28a745;">Task Completed</h2>
                    <p>Hi ${assignedPersonName},</p>
                    <p><strong>${empName}</strong> has successfully completed the task "<strong>${req.body.title}</strong>".</p>
                    <p>Please review it at your earliest convenience.</p>
                    <p style="margin-top: 20px;">Thank you!</p>
                  </div>
                </body>
                </html>
              `
                    });
                })
            );
        }

        // Send email notifications to newly assigned employees
        await Promise.all(emps.map(emp => {
            // const empName = `${emp.FirstName} ${emp.LastName}`;
            return sendMail({
                From: assignedPerson.Email,
                To: emp.Email,
                Subject: `${assignedPersonName} has assigned a task to you`,
                HtmlBody: projectMailContent(emp, assignedPerson, assignedPerson.company, req.body, "task")
            });
        }));

        return res.status(200).send({ message: "Task updated successfully", task });

    } catch (error) {
        console.error("Task Update Error:", error);
        return res.status(500).send({ error: error.message });
    }
});

router.delete("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send({ error: "Task not found" });
        }
        if (task.project) {
            const project = await Project.findOne({ tasks: req.params.id }, "tasks");
            const removedTaskList = project?.tasks?.filter((item) => item !== req.params.id)
            project.tasks = removedTaskList;
            await project.save();
        }
        return res.send({ message: "Task was delete successfully" })
    } catch (error) {
        console.log("error in delte task", error);
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;
