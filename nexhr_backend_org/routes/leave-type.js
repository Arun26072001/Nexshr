const express = require('express');
const router = express.Router();
const { LeaveType, LeaveTypeValidation } = require('../models/LeaveTypeModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require('../auth/authMiddleware');
const { errorCollector, getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const companyId = getCompanyIdFromToken(req.headers["authorization"]);
        if (!companyId) {
            return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
        }
        if (await LeaveType.exists({ LeaveName: req.body.LeaveName, company: companyId })) {
            return res.status(400).send({ error: `${req.body.LeaveName} is already exists` })
        }
        const validation = LeaveTypeValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const addLeaveType = await LeaveType.create({ ...req.body, company: companyId });
            res.send({ message: `${addLeaveType.LeaveName} has been added!` })
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: error.message })
    }
});

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const companyId = getCompanyIdFromToken(req.headers["authorization"]);
        if (!companyId) {
            return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." })
        }
        const leaveTypes = await LeaveType.find({ isDeleted: false, company: companyId }).exec();
        res.send(leaveTypes)
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: error.message });
    }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        // check is valid id
        const { id } = req.params;
        if (!checkValidObjId(id)) {
            return res.status(400).send({ error: "Invalid or missing LeaveType Id" })
        }
        const { error } = LeaveTypeValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const updateLeaveType = await LeaveType.findByIdAndUpdate(id, req.body, { new: true })
        return res.status(200).send({ message: `${updateLeaveType.LeaveName} has been updated successfully`, updateLeaveType })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        // check is valid id
        const { id } = req.params;
        if (!checkValidObjId(id)) {
            return res.status(400).send({ error: "Invalid or missing LeaveType Id" })
        }
        const deleteLeaveType = await LeaveType.findByIdAndUpdate(id, { isDeleted: true });
        return res.send({ message: `${deleteLeaveType.LeaveName} LeaveType has been deleted successfully` })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;