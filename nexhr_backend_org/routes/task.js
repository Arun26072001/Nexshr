const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Task, taskValidation } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const { Employee } = require("../models/EmpModel");
const sendMail = require("./mailSender");
const { convertToString, getCurrentTimeInMinutes, timeToMinutes, formatTimeFromMinutes, projectMailContent } = require("../Reuseable_functions/reusableFunction");
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
                        timeHolder: task?.spend?.timeHolder?.split(":")?.length === 2 && ["00:00:00"].includes(task.spend?.timeHolder) ? formatTimeFromMinutes(
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

        const taskData = await Task.find({ assignedTo: { $in: collegues }, from: { $gte: fromDate, $lte: toDate } });
        return res.send(taskData)

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
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
            assignedTo: [...req.body.assignedTo, req.params.id],
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

            sendMail({
                From: process.env.FROM_MAIL,
                To: emp.Email,
                Subject: `${createdPersonName} has Assigned a Task to You`,
                HtmlBody: projectMailContent(emp, empData, empData.company, req.body, "task")
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
        const newAssignees = req.body?.assignedTo?.filter(emp => !taskData?.assignedTo?.includes(emp)) || [];

        // Fetch Assigned Person & Employee Data
        const [assignedPerson, empData, emps] = await Promise.all([
            await Employee.findById(req.body.createdby)
                .populate({ path: "company", select: "CompanyName" }),
            await Employee.findById(req.params.empId),
            await Employee.find({ _id: { $in: newAssignees } }, "FirstName LastName Email")
        ])
        // const assignedPerson = await Employee.findById(req.body.createdby)
        //     .populate({ path: "company", select: "CompanyName" });
        // const empData = await Employee.findById(req.params.empId);
        // const emps = await Employee.find({ _id: { $in: newAssignees } }, "FirstName LastName Email");
        if (!assignedPerson) return res.status(404).send({ error: "Assigned person not found" });
        if (!empData) return res.status(404).send({ error: "Employee not found" });


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
                    message: `Task field "${key}" updated by ${empData.FirstName} ${empData.LastName} from ${oldValue} to ${newValue}`,
                    who: req.params.empId
                };
            }
            return [];
        });

        let updatedComment = null;
        // for add from task with only one comment
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
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>${assignedPerson.company.CompanyName}</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
                      <div style="text-align: center; padding-top: 30px;">
                        <img src="${assignedPerson.company.logo}" alt="Company Logo" style="width: 100px; height: 100px; object-fit: cover; margin-bottom: 10px;" />
                      </div>
                  
                      <div style="display: flex; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: left;">
                          <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 10px;">Task Completed Successfully</h2>
                          <div style="border-bottom: 3px solid #28a745; width: 30px; margin-bottom: 20px;"></div>
                  
                          <p style="font-size: 15px; margin-bottom: 15px;">Hey ${assignedPersonName} 👋,</p>
                          <p style="font-size: 15px; margin-bottom: 10px;">
                            <strong>${empName}</strong> has successfully completed the task titled "<strong>${req.body.title}</strong>".
                          </p>
                          <p style="font-size: 15px; margin-bottom: 10px;">
                            Please review the completed task and take any necessary actions.
                          </p>
                  
                          <p style="margin-top: 20px;">Thank you!</p>
                        </div>
                      </div>
                  
                      <div style="text-align: center; font-size: 13px; color: #777; margin-top: 20px; padding-bottom: 20px;">
                        <p>
                          Have questions? <a href="mailto:${emp.Email}" style="color: #007BFF; text-decoration: none;">Contact ${empName}</a>.
                        </p>
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
                HtmlBody: projectMailContent(emp, assignedPerson, assignedPerson.comapany, req.body, "task")
            });
        });

        return res.status(200).send({ message: "Task updated successfully", task });

    } catch (error) {
        console.error(error.message);
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
