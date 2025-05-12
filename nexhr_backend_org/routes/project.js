const express = require('express');
const router = express.Router();
const { Project, projectValidation } = require('../models/ProjectModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHRTeamHigherAuth } = require('../auth/authMiddleware');
const { Task } = require('../models/TaskModel');
const sendMail = require('./mailSender');
const { Employee } = require('../models/EmpModel');
const { error } = require('joi/lib/types/lazy');
const { Report } = require('../models/ReportModel');
const { convertToString, projectMailContent } = require('../Reuseable_functions/reusableFunction');
const { sendPushNotification } = require('../auth/PushNotification');

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

router.post("/:id", verifyAdminHRTeamHigherAuth, async (req, res) => {
  try {
    const creatorId = req.params.id;
    const employeeIds = Array.isArray(req.body.employees) ? req.body.employees : [];

    const [creator, assignees] = await Promise.all([
      Employee.findById(creatorId).populate("company", "logo CompanyName"),
      Employee.find({ _id: { $in: employeeIds } }, "FirstName LastName Email fcmToken notifications")
    ]);

    if (!creator) {
      return res.status(404).send({ error: "Creator not found." });
    }

    const projectName = req.body.name;
    if (await Project.exists({ name: projectName })) {
      return res.status(400).send({ error: `${projectName} project already exists.` });
    }

    const message = `${projectName} project is created by ${creator.FirstName}`;
    const allEmployees = [...new Set([...employeeIds, creatorId])]; // Unique employee IDs

    const newProject = {
      ...req.body,
      status: req.body.status || "Not Started",
      employees: allEmployees,
      createdby: req.body.createdby || creatorId,
      tracker: [{
        date: new Date(),
        message,
        who: creatorId
      }]
    };

    const { error } = projectValidation.validate(newProject);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const project = await Project.create(newProject);

    const Subject = `Welcome to ${projectName} project by ${creator.FirstName}`;

    await Promise.all(
      assignees.map(async (emp) => {
        // Send Email
        await sendMail({
          From: process.env.FROM_MAIL,
          To: emp.Email,
          Subject,
          HtmlBody: projectMailContent(emp, creator, creator.company, req.body, "project")
        });

        // Add notification & send push if fcmToken exists
        const notification = {
          company: creator.company._id,
          title: Subject,
          message,
        };

        const fullEmp = await Employee.findById(emp._id);
        if (fullEmp) {
          fullEmp.notifications.push(notification);
          await fullEmp.save();

          if (fullEmp.fcmToken) {
            await sendPushNotification({
              token: fullEmp.fcmToken,
              title: Subject,
              body: message,
              company: creator.company
            });
          }
        }
      })
    );

    return res.status(201).send({
      message: "Project created successfully.",
      project
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: error.message || "Server error occurred." });
  }
});


router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    // Clean up input
    delete req.body['_id'];
    delete req.body['__v'];

    const projectData = await Project.findById(req.params.id);
    const employee = await Employee.findById(req.params.empId);

    if (!projectData || !employee) {
      return res.status(404).json({ message: "Project or Employee not found" });
    }

    const { FirstName, LastName } = employee;
    const changes = Object.entries(req.body).flatMap(([key, newVal]) => {
      const oldVal = convertToString(projectData[key]);
      const newValStr = convertToString(newVal);

      const isDifferent = typeof oldVal === 'object'
        ? JSON.stringify(oldVal) !== JSON.stringify(newValStr)
        : oldVal !== newValStr;

      if (
        newVal !== undefined &&
        isDifferent &&
        !["createdAt", "createdby", "tracker", "updatedAt", "_id", "__v"].includes(key)
      ) {
        return [{
          date: new Date(),
          message: `Project field "${key}" updated by ${FirstName} ${LastName}`,
          who: req.params.empId
        }];
      }
      return [];
    });

    // Build updated data
    const updatedProject = {
      ...req.body,
      tracker: [...(projectData.tracker || []), ...changes]
    };

    const { error } = projectValidation.validate(updatedProject);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    // Find new assignees (if any)
    const { employees: existingEmployees } = projectData;
    const newAssignees = req.body.employees?.filter(empId => !existingEmployees.includes(empId)) || [];

    const [assignedPerson, newAssigneeDocs] = await Promise.all([
      Employee.findById(req.body.createdby).populate("company", "CompanyName logo Email FirstName LastName"),
      Employee.find({ _id: { $in: newAssignees } }, "FirstName LastName Email fcmToken notifications company")
    ]);

    // Update project
    const project = await Project.findByIdAndUpdate(req.params.id, updatedProject, { new: true });
    if (!project) {
      return res.status(404).send({ error: "Project not found after update" });
    }

    // Send notification and mail to new assignees
    const subject = `Welcome to ${req.body.name} project by ${assignedPerson.FirstName}`;
    const notifyMessage = `${req.body.name} project is updated and you're assigned to it.`;

    await Promise.all(newAssigneeDocs.map(async (emp) => {
      // Send mail
      await sendMail({
        From: assignedPerson.Email,
        To: emp.Email,
        Subject: subject,
        HtmlBody: projectMailContent(emp, assignedPerson, assignedPerson.company, req.body, "project")
      });

      // Push notification
      const notification = {
        company: assignedPerson.company._id,
        title: subject,
        message: notifyMessage
      };

      const fullEmp = await Employee.findById(emp._id); // Full doc needed to push notifications
      if (fullEmp) {
        fullEmp.notifications.push(notification);
        await fullEmp.save();

        if (fullEmp.fcmToken) {
          await sendPushNotification({
            token: fullEmp.fcmToken,
            title: subject,
            body: notifyMessage,
            company: assignedPerson.company
          });
        }
      }
    }));

    return res.status(200).send({
      message: "Project updated successfully",
      project
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: err.message || "Internal Server Error" });
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