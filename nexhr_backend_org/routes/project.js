const express = require('express');
const router = express.Router();
const { Project, ProjectValidation, projectValidation } = require('../models/ProjectModel');
const { verifyAdmin } = require('../auth/authMiddleware');
const Joi = require("joi");

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const project = await Project.find()
      .populate({ path: "company", select: "CompanyName" })
      // .populate({ path: "createdBy", select: "FirstName LastName" })
      .populate({ path: "employees", select: "FirstName LastName" })
    return res.send(project);
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
    // Validate the request body
    const { error } = projectValidation.validate(req.body);
    if (error) {
      console.error(error);
      return res.status(400).send(error.details[0].message);
    }

    const updatedProject = { ...req.body };

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

router.delete("/:id", verifyAdmin, (req, res) => {
  // const { orgName } = jwt.decode(req.headers['authorization']);
  // const Project = getProjectModel(orgName)
  Project.findByIdAndRemove({ _id: req.params.id }, function (err, project) {
    if (err) {
      console.log("error");
      res.send("err");
    } else {
      console.log("project deleted");
      res.send(project);
    }
  });
  console.log("delete");
  console.log(req.params.id);
});

module.exports = router;