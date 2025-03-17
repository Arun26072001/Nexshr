const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Task, taskValidation } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { convertToString, getCurrentTimeInMinutes, timeToMinutes, formatTimeFromMinutes } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

router.get("/project/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        let tasks = await Task.find({ project: { $in: req.params.id } })
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
                        timeHolder: task?.spend?.timeHolder?.split(":")?.length > 2 && ["00:00:00"].includes(task.spend?.timeHolder) ? formatTimeFromMinutes(
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

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    const { withComments } = req.query;
    try {
        let query = Task.findById(req.params.id)
            .populate({
                path: "tracker.who", // Populate 'who' inside tracker
                select: "FirstName LastName Email profile" // Fetch only required fields
            })
            .populate("comments.createdBy", "FirstName LastName profile")
            .populate({
                path: "createdby", // Populate 'createdby'
                select: "FirstName LastName Email profile"
            });

        if (withComments) {
            query = query
                .populate("assignedTo", "FirstName LastName profile")
        }

        let task = await query;

        if (!task) {
            return res.status(404).send({ error: "No Task found" })
        }

        let startingTimes = task?.spend?.startingTime;
        let endingTimes = task?.spend?.endingTime;

        const values = startingTimes?.map((startTime, index) => {
            if (!startTime) return 0; // No start time means no value

            let endTimeInMin = 0;
            if (endingTimes[index]) {
                // Calculate time difference with an ending time
                endTimeInMin = timeToMinutes(endingTimes[index]);
            } else {
                // Calculate time difference with the current time
                endTimeInMin = getCurrentTimeInMinutes();
            }
            const startTimeInMin = timeToMinutes(startTime);
            return Math.abs(endTimeInMin - startTimeInMin);
        });

        const totalValue = values?.reduce((acc, value) => acc + value, 0)
        //add comments of spend time
        let totalCommentSpendTime = 0;
        task?.comments?.map((comment) => totalCommentSpendTime += Number(comment.spend));
        const timeHolder = formatTimeFromMinutes(totalValue + (totalCommentSpendTime * 60));
        if (task?.spend?.timeHolder) {
            task.spend.timeHolder = timeHolder;
        }

        if (!withComments) {
            task = {
                ...task.toObject(),
                comments: []
            }
        } else {
            const notDeletedComments = task?.comments?.filter((comment) => comment.isDeleted === false)
            task = {
                ...task.toObject(),
                comments: notDeletedComments
            }
        }

        return res.send(task);
    } catch (error) {
        console.log(error);

        res.status(500).send({ error: error.message })
    }
})

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // Validate Project
        const project = await Project.findById(req.body.project).populate("tasks");
        if (!project) {
            return res.status(404).send({ error: "Project not found." });
        }

        // Validate Task Uniqueness
        if (await Task.exists({ title: req.body.title })) {
            return res.status(400).send({ error: "Task already exists" });
        }

        // Fetch Employee Data
        const empData = await Employee.findById(req.params.id).populate("company");
        if (!empData) {
            return res.status(404).send({ error: "Employee not found." });
        }

        // Prepare Task Object
        const newTask = {
            ...req.body,
            createdby: req.params.id,
            status: req.body.status || "On Hold",
            tracker: [],
            spend: req.body.spend || {}
        };

        // Validate Task Data
        const { error } = taskValidation.validate(newTask);
        if (error) {
            return res.status(400).send({ error: error.details[0].message });
        }

        // Fetch Assigned Employees
        const assignedEmps = await Employee.find({ _id: { $in: req.body.assignedTo } }, "FirstName LastName Email");

        // Create Task Tracking Logs
        const trackers = [
            {
                date: new Date(),
                message: `New Task (${req.body.title}) created by ${empData.FirstName} ${empData.LastName}`,
                who: req.params.id
            }
        ];

        if (assignedEmps.length > 0) {
            trackers.push({
                date: new Date(),
                message: `${assignedEmps.map(emp => emp.FirstName + " " + emp.LastName).join(", ")} Assigned in this task by ${empData.FirstName} ${empData.LastName}`,
                who: req.params.id
            });
        }

        newTask.tracker = trackers;

        // Create Task
        const task = await Task.create(newTask);

        // Update Project with New Task
        project.tasks.push(task._id);
        await project.save();

        // Send Emails to Assigned Employees
        assignedEmps.forEach(emp => {
            const createdPersonName = `${empData.FirstName.charAt(0).toUpperCase()}${empData.FirstName.slice(1)} ${empData.LastName}`;
            const empName = `${emp.FirstName.charAt(0).toUpperCase()}${emp.FirstName.slice(1)} ${emp.LastName}`;

            sendMail({
                From: empData.Email,
                To: emp.Email,
                Subject: `${createdPersonName} has Assigned a Task to You`,
                HtmlBody: `
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>${empData.company.CompanyName}</title>
                                </head>
                                <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                                    <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                        <!-- Header -->
                                        <div style="text-align: center; padding-bottom: 15px;">
                                            <h1 style="font-size: 20px; color: #333; margin: 0;">${createdPersonName} has Assigned a Task to You!</h1>
                                        </div>

                                        <!-- Content -->
                                        <div style="margin: 20px 0; padding: 10px;">
                                            <p style="font-size: 14px; color: #333; margin: 10px 0;">Hey ${empName} 👋,</p>
                                            <p style="font-size: 14px; color: #333; margin: 10px 0;">
                                                <b>${createdPersonName} has created a task named "${req.body.title}".</b>
                                            </p>
                                            <p style="font-size: 14px; color: #333; margin: 10px 0;">
                                                You have been assigned to this task as a responsible member.
                                            </p>
                                            <p style="font-size: 14px; color: #333; margin: 10px 0;">
                                                Please follow the provided instructions and complete the task accordingly.
                                            </p>
                                            <br />
                                            <p style="font-size: 14px; color: #333; margin: 10px 0;">Thank you!</p>
                                        </div>

                                        <!-- Footer -->
                                        <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                                            <p style="margin: 10px 0;">
                                                Have questions? Need help?
                                                <a href="mailto:${empData.Email}" style="color: #007BFF; text-decoration: none;">
                                                    Contact ${empData.FirstName}
                                                </a>.
                                            </p>
                                        </div>
                                    </div>
                                </body>
                            </html>

                            `
            });
        });

        return res.send({ message: "Task is created successfully.", task });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // Fetch Task Data
        const taskData = await Task.findById(req.params.id);
        if (!taskData) return res.status(404).send({ error: "Task not found" });

        // Identify Newly Assigned Employees
        const newAssignees = req.body.assignedTo?.filter(emp => !taskData?.assignedTo?.includes(emp)) || [];

        // Fetch Assigned Person & Employee Data
        const assignedPerson = await Employee.findById(req.body.createdby)
            .populate({ path: "company", select: "CompanyName" });

        if (!assignedPerson) return res.status(404).send({ error: "Assigned person not found" });

        const empData = await Employee.findById(req.params.empId);
        if (!empData) return res.status(404).send({ error: "Employee not found" });

        const emps = await Employee.find({ _id: { $in: newAssignees } }, "FirstName LastName Email");

        // Generate Task Change Logs
        const taskChanges = Object.entries(taskData.toObject()).flatMap(([key, value]) => {
            const newValue = convertToString(req.body[key]);
            const oldValue = convertToString(value);
            if (
                newValue !== undefined &&
                !["createdAt", "createdby", "tracker", "updatedAt", "_id", "tracker", "__v", "spend", "from", "to"]?.includes(key) &&
                (Array.isArray(oldValue) ? oldValue.length !== newValue.length : oldValue !== newValue)
            ) {
                return {
                    date: new Date(),
                    message: `Task field "${key}" updated by ${empData.FirstName} ${empData.LastName}`,
                    who: req.params.empId
                };
            }
            return [];
        });

        let updatedComment = null;
        if (req.query.changeComments && req.body.comments && req.body.comments.length > 0) {
            updatedComment = {
                ...req.body.comments[0],
                createdBy: req.params.empId,
                date: new Date()
            };
        }

        // Ensure `createdby` is stored correctly as an ObjectId or string
        const createdById = typeof req.body.createdby === "object" ? req.body.createdby._id : req.body.createdby;

        // Ensure `comments` is an array and properly updated
        const updatedComments = req.body.comments?.length === 1 && updatedComment
            ? [...taskData.comments, updatedComment]
            : req.body.comments || taskData.comments;

        // Prepare Updated Task Data
        const updatedTask = {
            ...req.body,
            tracker: [...taskData.tracker, ...taskChanges],
            createdby: createdById,
            comments: updatedComments
        };

        // Update Task in Database
        const task = await Task.findByIdAndUpdate(req.params.id, updatedTask, { new: true });

        // Ensure Task Exists After Update
        if (!task) return res.status(404).send({ error: "Failed to update task" });

        // Prepare Assigned Person's Name
        const assignedPersonName = `${assignedPerson.FirstName.charAt(0).toUpperCase()}${assignedPerson.FirstName.slice(1)} ${assignedPerson.LastName}`;

        // Send Emails for Task Completion
        if (req.body.status === "Completed") {
            emps.forEach(emp => {
                const empName = `${emp.FirstName.charAt(0).toUpperCase()}${emp.FirstName.slice(1)} ${emp.LastName}`;
                sendMail({
                    From: emp.Email,
                    To: assignedPerson.Email,
                    Subject: `Your assigned task (${req.body.title}) is completed`,
                    HtmlBody: `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${assignedPerson.company.CompanyName}</title>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                            .header { text-align: center; padding: 20px; }
                            .content { margin: 20px 0; }
                            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Your Assigned Task Has Been Completed</h1>
                            </div>
                            <div class="content">
                                <p>Hey ${assignedPersonName} 👋,</p>
                                <p><b>${empName} has successfully completed the task named "${req.body.title}".</b></p>
                                <p>Please review the completed task and take any necessary actions.</p><br />
                                <p>Thank you!</p>
                            </div>
                            <div class="footer">
                                <p>Have questions? Need help? <a href="mailto:${emp.Email}">Contact ${empName}</a>.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    `
                });
            });
        }

        // Send Emails for Newly Assigned Employees
        emps.forEach(emp => {
            const empName = `${emp.FirstName.charAt(0).toUpperCase()}${emp.FirstName.slice(1)} ${emp.LastName}`;
            sendMail({
                From: assignedPerson.Email,
                To: emp.Email,
                Subject: `${assignedPersonName} has assigned a task to you`,
                HtmlBody: `
                            <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <title>${assignedPerson.company.CompanyName}</title>
                                            <style>
                                                body {font - family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0; }
                                                .container {max - width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                                                .header {text - align: center; padding: 20px; }
                                                .content {margin: 20px 0; }
                                                .footer {text - align: center; font-size: 14px; margin-top: 20px; color: #777; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="header">
                                                    <h1>${assignedPersonName} has Assigned a Task to You!</h1>
                                                </div>
                                                <div class="content">
                                                    <p>Hey ${empName} 👋,</p>
                                                    <p><b>${assignedPersonName} has created a task named "${req.body.title}".</b></p>
                                                    <p>You have been assigned to this task as a responsible member.</p>
                                                    <p>Please follow the provided instructions and complete the task accordingly.</p><br />
                                                    <p>Thank you!</p>
                                                </div>
                                                <div class="footer">
                                                    <p>Have questions? Need help? <a href="mailto:${assignedPerson.Email}">Contact ${assignedPersonName}</a>.</p>
                                                </div>
                                            </div>
                                        </body>
                                    </html>
                                    `
            });
        });

        return res.status(200).send({ message: "Task updated successfully", task });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
});



router.delete("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const project = await Project.findOne({ tasks: { $in: req.params.id } })
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send({ error: "Task not found" });
        }
        project.tasks.pop(req.params.id);
        await project.save();
        return res.send({ message: "Task was delete successfully" })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;
