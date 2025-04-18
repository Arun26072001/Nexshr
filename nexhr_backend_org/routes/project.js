const express = require('express');
const router = express.Router();
const { Project, projectValidation } = require('../models/ProjectModel');
const { verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { Task } = require('../models/TaskModel');
const sendMail = require('./mailSender');
const { Employee } = require('../models/EmpModel');
const { error } = require('joi/lib/types/lazy');
const { Report } = require('../models/ReportModel');
const { convertToString } = require('../Reuseable_functions/reusableFunction');

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(200).send({ message: "Project" })
    }
    return res.send(project);
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
});

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const projects = await Project.find({ trash: false }, "-trash -tracker")
      .populate("company", "CompanyName")
      .populate("employees", "FirstName LastName Email")
      .populate("tasks", "-tracker -comments");

    const formattedProjects = projects.map((project) => {
      const { tasks } = project;
      const completedTasksCount = tasks.filter(task => task.status === "Completed").length;
      const progress = tasks.length ? (completedTasksCount / tasks.length) * 100 : 0;
      const pendingTasks = tasks.filter(task => task.status !== "Completed");

      return {
        ...project.toObject(),
        progress,
        pendingTasks
      };
    });

    res.send(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send({ error: "An error occurred while fetching projects." });
  }
});

router.get("/employees/:projectId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    if (await Project.exists({ _id: req.params.projectId })) {
      const { employees } = await Project.findById(req.params.projectId, "employees").populate("employees", "FirstName LastName").exec();
      return res.send(employees)
    } else {
      return res.status(404).send([])
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.get("/emp/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const projects = await Project.find({ employees: { $in: req.params.id }, trash: false }, "-tasks -reports -tracker")
      .populate({ path: "company", select: "CompanyName" })
      .populate({ path: "employees", select: "FirstName LastName Email" })
      .populate({ path: "tasks" })
      .exec();

    return res.send(projects);
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const assignees = await Employee.find({ _id: req.body.employees }, "FirstName LastName Email");
    const { Email, FirstName, company } = await Employee.findById(req.params.id, "FirstName LastName Email").populate({ path: "company" })
    const newProject = {
      ...req.body,
      status: req.body.status || "Not Started",
      employees: [...req?.body?.employees, req?.params?.id] || [],
      createdby: req?.body?.createdby || req?.params?.id,
      tracker: [{
        date: new Date(),
        message: `${req.body.name} Project is created by ${FirstName}`,
        who: req.params.id
      }]
    }
    if (await Project.exists({ name: req.body.name })) {
      return res.status(400).send({ error: `${req.body.name} project is already exists` })
    }

    const { error } = projectValidation.validate(newProject);
    if (error) {
      return res.status(400).send({ error: error.details[0].message })
    }
    const project = await Project.create(newProject);

    // send mail for assignees
    assignees.map((emp) => {
      const empName = emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1) + " " + emp.LastName
      return sendMail({
        From: process.env.FROM_MAIL,
        To: emp.Email,
        Subject: `Welcome to ${req.body.name} project by ${FirstName}`,
        HtmlBody: `
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${company.CompanyName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; padding: 20px;">
                <h1 style="margin: 0;">Welcome to ${req.body.name[0].toUpperCase() + req.body.name.slice(1)}</h1>
              </div>
              <div style="margin: 20px 0;">
                <p>Hey ${empName} 👋,</p>
                <p><b>${FirstName[0].toUpperCase() + FirstName.slice(1)} has created a project named "${req.body.name}".</b></p>
                <p>As a result, you have been assigned as a member of this project.</p>
                <p>Please follow the instructions.</p><br />
                <p>Thank you!</p>
              </div>
              <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                <p>Have questions? Need help? <a href="mailto:${Email}">Contact ${FirstName[0].toUpperCase() + FirstName.slice(1)}</a>.</p>
              </div>
            </div>
          </body>
        </html>
        `
      })
    })
    return res.status(201).send({ message: "Project is created Successfully", project })
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message })
  }
});

router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {

    delete req.body['_id'];
    delete req.body["__v"];
    const projectData = await Project.findById(req.params.id);
    const employee = await Employee.findById(req.params.empId);

    if (!projectData || !employee) {
      return res.status(404).json({ message: "Project or Employee not found" });
    }

    const { FirstName, LastName } = employee;
    const projectChanges = Object.entries(projectData.toObject()).flatMap(([name, value]) => {
      const oldValue = convertToString(value);
      const newValue = convertToString(req.body[name]);
      const valueOfType = typeof oldValue;
      if (req.body[name] !== undefined && (valueOfType === "object" ? oldValue.length !== newValue.length : oldValue !== newValue) && !["createdAt", "createdby", "tracker", "updatedAt"].includes(name)) {

        return {
          date: new Date(),
          message: `Project field "${req.body[name]}" updated by ${FirstName} ${LastName}`,
          who: req.params.empId
        };
      }
      return [];
    });

    const updatedProject = {
      ...req.body,
      tracker: [...req.body.tracker, ...projectChanges]
    };

    // Validate the request body
    const { error } = projectValidation.validate(updatedProject);
    if (error) {
      console.error(error);
      return res.status(400).send({ error: error.details[0].message });
    }
    const { employees } = await Project.findById(req.params.id, "employees");
    const newAssiness = req?.body?.employees?.filter((emp) => !employees?.includes(emp));
    const assignedPerson = await Employee.findById({ _id: req.body.createdby }, "FirstName LastName Email").populate({ path: "company", select: "CompanyName" });

    const emps = await Employee.find({ _id: newAssiness }, "FirstName LastName Email")
    // Update the project in the database
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updatedProject,
      { new: true } // Return the updated document
    );
    // send mail for assignees
    emps.map((emp) => {
      const empName = emp.FirstName[0].toUpperCase() + emp.FirstName.slice(1) + " " + emp.LastName;
      const assignedPersonName = assignedPerson.FirstName[0].toUpperCase() + assignedPerson.FirstName.slice(1) + " " + assignedPerson.LastName;
      return sendMail({
        From: assignedPerson.Email,
        To: emp.Email,
        Subject: `Welcome to ${req.body.name} project by ${assignedPersonName}`,
        HtmlBody: `
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${assignedPerson?.company?.CompanyName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; padding: 20px;">
                <h1 style="margin: 0;">Welcome to ${req.body.name[0].toUpperCase() + req.body.name.slice(1)}</h1>
              </div>
              <div style="margin: 20px 0;">
                <p>Hey ${empName} 👋,</p>
                <p><b>${assignedPersonName} has created a project named ${req.body.name}.</b></p>
                <p>As a result, you have been assigned as a member of this project.</p>
                <p>Please follow the instructions.</p><br />
                <p>Thank you!</p>
              </div>
              <div style="text-align: center; font-size: 14px; margin-top: 20px; color: #777;">
                <p>Have questions? Need help? <a href="mailto:${assignedPerson.Email}">Contact ${assignedPersonName}</a>.</p>
              </div>
            </div>
          </body>
        </html>
        `
      })
    })
    if (!project) {
      return res.status(404).send("Project not found");
    }

    res.status(200).send({ message: "Project is updated Successfully", project });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: error.message });
  }
});

router.delete("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    project.trash = true;
    await project.save();

    const tasks = await Task.find({ project: req.params.id });
    const reports = await Report.find({ project: req.params.id })

    await Promise.all(
      tasks.map(async (task) => {
        task.trash = true;
        return task.save();
      })
    );
    await Promise.all(
      reports.map(async (report) => {
        report.trash = true;
        await report.save();
      })
    );

    return res.send({ message: "Project and Tasks were put in trash" });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});


module.exports = router;