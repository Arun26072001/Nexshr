const express = require("express");
const { verifyAdminHREmployee } = require("../auth/authMiddleware");
const { Task, taskValidation } = require("../models/TaskModel");
const { Project } = require("../models/ProjectModel");
const router = express.Router();

router.get("/project/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        let tasks = await Task.find({ project: { $in: req.params.id }, status: { $in: ['Pending', 'In Progress', 'On Hold'] } })
            .populate({ path: "project", select: "name color" })
            .populate({ path: "assignedTo", select: "FirstName LastName" })
            .exec();
        if (tasks.length === 0) {
            return res.status(404).send({ error: "No Task found in this Project" })
        }
        return res.send({ tasks });
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id)
            // .populate({path: "project", select: "name"})
            // .populate({path: "assignedTo", select: "FirstName LastName"})
            .exec();
        if (!task) {
            return res.status(404).send({ error: "No Task found" })
        }
        return res.send(task);
    } catch (error) {
        console.log(error);

        res.status(500).send({ error: error.message })
    }
})

router.post("/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        const project = await Project.findById(req.body.project);
        if (!project) {
            return res.status(404).send({ error: "Project not found." })
        }
        if (await Task.exists({ title: req.body.title })) {
            return res.status(400).send({ error: "Task already exists" })
        }

        const newTask = {
            ...req.body,
            createdby: req.params.id,
            status: req?.body?.status || "On Hold",
        }
        const { error } = taskValidation.validate(newTask);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        } else {
            const task = await Task.create(newTask);
            project.tasks.push(task._id);
            await project.save();
            return res.send({ message: "Task is created successfully.", task })
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

router.put("/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        const updatedTask = {
            ...req.body,
            // createdBy: req.params.id
        }
        console.log(updatedTask);

        const { error } = taskValidation.validate(updatedTask);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })

        } else {
            const task = await Task.findByIdAndUpdate(req.params.id, updatedTask, { new: true });
            return res.status(201).send({ message: "Task is updated successfully", task })
        }
    } catch (error) {
        console.log(error);
        
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHREmployee, async (req, res) => {
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