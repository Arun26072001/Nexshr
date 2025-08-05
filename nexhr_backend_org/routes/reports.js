const express = require("express");
const mongoose = require("mongoose");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Report, ReportValidation } = require("../models/ReportModel");
const { Project } = require("../models/ProjectModel");
const { Employee } = require("../models/EmpModel");
const { errorCollector, getCompanyIdFromToken } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

// Middleware to validate ObjectId
const checkValidObjId = (req, res, next) => {
  const idsToCheck = [req.params.id, req.params.empId, req.params.projectId].filter(Boolean);
  for (let id of idsToCheck) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: `Invalid ObjectId: ${id}` });
    }
  }
  next();
};

// Create Report
router.post("/:id", verifyAdminHREmployeeManagerNetwork, checkValidObjId, async (req, res) => {
  try {
    const id = req.params.id;
    // get company ID
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    const newReport = { ...req.body, createdby: id, company: companyId };

    const { error } = ReportValidation.validate(newReport);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    const empData = await Employee.findById(req.params.id, "FirstName LastName");
    const trackerEntry = {
      date: new Date(),
      message: `New Report (${req.body.name}) created by ${empData.FirstName} ${empData.LastName}`,
      who: req.params.id,
    };

    const result = await Report.create(newReport);
    project.reports.push(result._id);
    project.tracker.push(trackerEntry);
    await project.save();

    return res.send({ message: "Report is created successfully", result });
  } catch (error) {
    await errorCollector({
      url: req.originalUrl,
      name: error.name,
      message: error.message,
      env: process.env.ENVIRONMENT,
    });
    return res.status(500).send({ error: error.message });
  }
});

// Get all reports by creator
router.get("/createdby/:id", verifyAdminHREmployeeManagerNetwork, checkValidObjId, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
    }
    const reports = await Report.find({ createdby: req.params.id, isDeleted: false, company: companyId })
      .populate("createdby","FirstName LastName")
      .populate("project", "name")
      .populate("task", "title")
      .lean();

    return res.send({ reports });
  } catch (error) {
    console.log("error in get reports", error)
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

// Get a specific report
router.get("/:id", verifyAdminHREmployeeManagerNetwork, checkValidObjId, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
    if (!report) return res.status(404).send({ error: "Report not found" });
    return res.send(report);
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

// Update a report
router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, checkValidObjId, async (req, res) => {
  try {
    const { empId, id } = req.params;
    const updatedReport = { ...req.body };
    const { error } = ReportValidation.validate(updatedReport);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      updatedReport,
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).send({ error: "Report not found" });

    const project = await Project.findById(req.body.project);
    const empData = await Employee.findById(empId, "FirstName LastName");
    const trackerEntry = {
      date: new Date(),
      message: `Report updated by ${empData.FirstName} ${empData.LastName}`,
      who: empData._id,
    };

    project.tracker.push(trackerEntry);
    await project.save();

    return res.send({ message: "Report is updated successfully", report });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

// Soft-delete report
router.delete("/:id/:projectId", verifyAdminHREmployeeManagerNetwork, checkValidObjId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).send({ error: "Project not found" });

    const report = await Report.findByIdAndUpdate(req.params.id, { isDeleted: true });
    if (!report) return res.status(404).send({ error: "Report not found" });

    // Remove from project.reports only if present
    project.reports = project.reports.filter((repId) => repId.toString() !== req.params.id);
    await project.save();

    return res.send({ message: "Report was deleted successfully" });
  } catch (error) {
    await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT });
    return res.status(500).send({ error: error.message });
  }
});

module.exports = router;