const express = require('express');
const router = express.Router();
const { Project, ProjectValidation, projectValidation } = require('../models/ProjectModel');
const { verifyAdmin } = require('../auth/authMiddleware');
const Joi = require("joi");
const { Task } = require('../models/TaskModel');

router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    // .populate({ path: "company", select: "CompanyName" })
    // .populate({ path: "employees", select: "FirstName LastName" })
    return res.send(project);
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
});

router.get("/", verifyAdmin, async (req, res) => {
  try {
    let projects = await Project.find()
      .populate({ path: "company", select: "CompanyName" })
      .populate({ path: "employees", select: "FirstName LastName" })
      .populate({ path: "tasks" })

    projects = projects.map((project) => {
      const completedTasks = project.tasks.filter((task) => task.status === "Completed")
      const pendingTasks = project.tasks.filter((task) => task.status !== "Completed")
      return {
        ...project.toObject(),
        "progress": (completedTasks.length / project.tasks.length) * 100,
        pendingTasks
      }
    })
    return res.send(projects);
  } catch (error) {
    console.log(error);

    return res.status(500).send({ error: error.message })
  }
});

router.post("/:id", verifyAdmin, async (req, res) => {
  try {
    const newProject = {
      ...req.body,
      status: req.body.status || "Not Started",
      createdby: req.body.createdby || req.params.id
    }
    const { error } = projectValidation.validate(newProject);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    const project = await Project.create(newProject);
    return res.status(201).send({ message: "Project is created Successfully", project })
  } catch (error) {
    res.status(500).send({ error: message })
  }
});

router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    delete req.body['_id'];
    delete req.body["__v"]
    const updatedProject = { ...req.body };
    console.log(updatedProject);

    // Validate the request body
    const { error } = projectValidation.validate(updatedProject);
    if (error) {
      console.error(error);
      return res.status(400).send(error.details[0].message);
    }

    // Update the project in the database
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updatedProject,
      { new: true } // Return the updated document
    );

    if (!project) {
      return res.status(404).send("Project not found");
    }

    res.status(200).send({ message: "Project is updated Successfully", project });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while updating the project");
  }
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const deleteProject = await Project.findByIdAndDelete(req.params.id);
    const deleteTasks = await Task.deleteMany({ project: req.params.id });
    return res.send({ message: "Project and Tasks were delete successfully" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
});

module.exports = router;