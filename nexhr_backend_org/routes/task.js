const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Task, taskValidation } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { convertToString } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

function getTotalHours(from, to) {
    if (from && to) {
        const fromValue = new Date(from).getTime();
        const toValue = new Date(to).getTime();
        const difference = (toValue - fromValue) / (1000 * 60 * 60);
        console.log(difference);

        return difference;
    } else {
        return 0;
    }
}

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
            if (task.stopRunningAt) {
                console.log(task?.stopRunningAt);
                return ({
                    ...task.toObject(),
                    spend: task.spend + (new Date().getTime() - new Date(task?.stopRunningAt).getTime()) / 3600
                })
            } else {
                return ({
                    ...task.toObject()
                })
            }
        })

        return res.send({ tasks: timeUpdatedTasks });
    } catch (error) {
        console.log(error);

        res.status(500).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id).populate({
            path: "tracker.who", // Populate 'who' inside tracker
            select: "FirstName LastName Email profile" // Fetch only required fields
        }).populate({
            path: "createdby", // Populate 'who' inside tracker
            select: "FirstName LastName Email profile"
        })
        if (!task) {
            return res.status(404).send({ error: "No Task found" })
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
            spend: 0
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
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                            .content { margin: 20px 0; }
                            .footer { text-align: center; font-size: 14px; margin-top: 20px; color: #777; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>${createdPersonName} has Assigned a Task to You!</h1>
                            </div>
                            <div class="content">
                                <p>Hey ${empName} 👋,</p>
                                <p><b>${createdPersonName} has created a task named "${req.body.title}".</b></p>
                                <p>You have been assigned to this task as a responsible member.</p>
                                <p>Please follow the provided instructions and complete the task accordingly.</p><br />
                                <p>Thank you!</p>
                            </div>
                            <div class="footer">
                                <p>Have questions? Need help? <a href="mailto:${empData.Email}">Contact ${empData.FirstName}</a>.</p>
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
        const newAssignees = req.body.assignedTo?.filter(emp => !taskData?.employees?.includes(emp)) || [];

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
                !["createdAt", "createdby", "tracker", "updatedAt", "_id", "tracker", "__v", "spend"]?.includes(key) &&
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

        // Prepare Updated Task Data
        const updatedTask = {
            ...req.body,
            tracker: [...taskData.tracker, ...taskChanges],
            createdby: req.body.createdby._id || req.body.createdby
        };

        // Validate Task Data
        const { error } = taskValidation.validate(updatedTask);
        if (error) {
            return res.status(400).send({ error: error.details[0].message });
        }

        // Update Task in Database
        const task = await Task.findByIdAndUpdate(req.params.id, updatedTask, { new: true });

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