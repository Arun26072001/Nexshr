const express = require("express");
const { verifyAdminHREmployee } = require("../auth/authMiddleware");
const { Report, ReportValidation } = require("../models/ReportModel");
const { Project } = require("../models/ProjectModel");
const router = express.Router();

router.post("/:id", verifyAdminHREmployee, async (req, res) => {
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
        const result = await Report.create(newReport);
        project.reports.push(result._id);
        await project.save();
        return res.send({ message: "Report is created successfully", result })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get("/createdby/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        const reports = await Report.find({ createdby: req.params.id })
            .populate({ path: "createdby", select: "FirstName LastName" })
            .exec();
            console.log(reports);
            
        if (reports.length === 0) {
            return res.status(404).send({ error: "Reports not found" })
        } else {
            return res.send({ reports })
        }
    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: error.message })
    }
})

router.get("/:id", verifyAdminHREmployee, async (req, res) => {
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

router.put("/:id", verifyAdminHREmployee, async (req, res) => {
    try {
        const updatedReport = {
            ...req.body
        }
        const { error } = ReportValidation.validate(updatedReport);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const report = await Report.findByIdAndUpdate({ _id: req.params.id }, updatedReport, { new: true })
        return res.send({ message: "Report is updated Successfully", report })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id/:projectId", verifyAdminHREmployee, async (req, res) => {
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