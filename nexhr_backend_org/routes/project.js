const express = require('express');
const router = express.Router();
const { Project } = require('../models/ProjectModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHRTeamHigherAuth, verifyTeamHigherAuthority } = require('../auth/authMiddleware');
const { Task } = require('../models/TaskModel');
const sendMail = require('./mailSender');
const { Employee } = require('../models/EmpModel');
const { Report } = require('../models/ReportModel');
const { errorCollector, checkValidObjId, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    const projects = await Project.find({ isDeleted: false, company: companyId }, "-isDeleted -tracker")
      .populate("company", "CompanyName")
      .populate("employees", "FirstName LastName Email profile")
      .populate("tasks", "-tracker -comments");

    const formattedProjects = projects.map((project) => {
      const { tasks } = project;
      const completedTasksCount = tasks.filter(task => task.status === "Completed").length;
      const progress = tasks.length ? (completedTasksCount / tasks.length) * 100 : 0;
      const pendingTasks = tasks.filter(task => task.status === "Pending");

      return {
        ...project.toObject(),
        progress,
        pendingTasks
      };
    });

    res.send(formattedProjects);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
    console.error("Error fetching projects:", error);
    res.status(500).send({ error: "An error occurred while fetching projects." });
  }
});

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    if (!checkValidObjId(req.params.id)) {
      return res.status(400).send({ error: "Invalid project ID" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    return res.send(project);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

//
// ✅ 2. Get all employees assigned to a project
//
router.get("/employees/:projectId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!checkValidObjId(projectId)) {
      return res.status(400).send({ error: "Invalid project ID" });
    }

    const project = await Project.findById(projectId, "employees").populate("employees", "FirstName LastName");
    if (!project) {
      return res.status(404).send([]);
    }

    return res.send(project.employees);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});


//
// ✅ 3. Get all projects assigned to an employee
//
router.get("/emp/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    // check empId is exists
    const { id } = req.params;

    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid employee ID" });
    }

    const projects = await Project.find({ employees: id, isDeleted: false, company: companyId }, "-isDeleted -tracker")
      .populate({ path: "company", select: "CompanyName" })
      .populate({ path: "employees", select: "FirstName LastName Email profile" })
      .populate("tasks");

    const formattedProjects = projects.map((project) => {
      const completedTasks = project.tasks.filter(t => t.status === "Completed").length;
      const totalTasks = project.tasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const pendingTasks = project.tasks.filter(t => t.status === "Pending");

      return {
        ...project.toObject(),
        progress,
        pendingTasks
      };
    });

    return res.send(formattedProjects);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});


//
// ✅ 4. Create a project (by employee ID)
//
router.post("/:id", verifyAdminHRTeamHigherAuth, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    // check EmpId is exists
    const creatorId = req.params.id;
    if (!checkValidObjId(creatorId)) {
      return res.status(400).send({ error: "Invalid creator ID" });
    }

    const { error } = ProjectValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const project = new Project({
      ...req.body,
      createdBy: creatorId,
      company: req.body.company || companyId
    });

    await project.save();
    return res.status(201).send({ message: "Project created successfully", project });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

//
// ✅ 5. Update a project
//
router.put("/:empId/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    const { empId, id } = req.params;

    if (!checkValidObjId(empId) || !checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid project or employee ID" });
    }

    const { error } = ProjectValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const project = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    return res.send({ message: "Project updated successfully", project });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

//
// ✅ 6. Soft delete a project and mark its tasks & reports as deleted
//
router.delete("/:id", verifyTeamHigherAuthority, async (req, res) => {
  try {
    const { id } = req.params;

    if (!checkValidObjId(id)) {
      return res.status(400).send({ error: "Invalid project ID" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    project.isDeleted = true;
    await project.save();

    await Promise.all([
      Task.updateMany({ project: id }, { $set: { isDeleted: true } }),
      Report.updateMany({ project: id }, { $set: { isDeleted: true } })
    ]);

    return res.send({ message: "Project and its tasks/reports marked as deleted." });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

module.exports = router;