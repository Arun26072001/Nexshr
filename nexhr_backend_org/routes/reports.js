const express = require("express");
const { verifyAdminHREmployeeManagerNetwork } = require("../auth/authMiddleware");
const { Report, ReportValidation } = require("../models/ReportModel");
const { Project } = require("../models/ProjectModel");
const router = express.Router();

router.post("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const newReport = {
            ...req.body,
            createdby: req.params.id
        }
        const project = await Project.findById({ _id: req.body.project })
        if (!project) {
            return res.status(404).send({ error: "Project not found" });
        }
        const { error } = ReportValidation.validate(newReport);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const newTracker = {
            date: new Date(),
            message: `New Report(${req.body.name}) is created by ${empData.FirstName} ${empData.LastName}`,
            who: req.params.id
        }
        const result = await Report.create(newReport);
        project.reports.push(result._id);
        project.tracker.push(newTracker);
        await project.save();
        return res.send({ message: "Report is created successfully", result })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/createdby/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const reports = await Report.find({ createdby: req.params.id })
            .populate({ path: "createdby", select: "FirstName LastName" })
            .exec();

        if (reports.length === 0) {
            return res.status(200).send({ reports: [] })
        } else {
            return res.send({ reports })
        }
    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const report = await Report.findById({ _id: req.params.id })
            // .populate({ path: "createdby", select: "FirstName LastName" })
            .exec();
        if (!report) {
            return res.status(404).send({ error: "Report not found" })
        } else {
            return res.send(report)
        }
    } catch (error) {
        console.log(error);

        return res.status(500).send({ error: error.message })
    }
})

router.put("/:empId/:id", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const updatedReport = {
            ...req.body
        }
        const { error } = ReportValidation.validate(updatedReport);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const report = await Report.findByIdAndUpdate({ _id: req.params.id }, updatedReport, { new: true });
        const projectData = await Project.findById(req.body.project);
        const empData = await Employee.findById(req.params.empId);
        const newTracker = {
            date: new Date(),
            message: `Report is updated by ${empData.FirstName} ${empData.LastName}`,
            who: empData._id
        }
        projectData.tracker.push(newTracker);
        await projectData.save();
        return res.send({ message: "Report is updated Successfully", report })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id/:projectId", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const project = await Project.findById({ _id: req.params.projectId }).exec();
        const deleteReport = await Report.findByIdAndDelete({ _id: req.params.id });
        project.reports.pop(req.params.id);
        await project.save();
        return res.send({ message: "Report was Deleted Successfully" })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;