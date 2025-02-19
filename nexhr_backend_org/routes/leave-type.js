const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { LeaveType, LeaveTypeValidation } = require('../models/LeaveTypeModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require('../auth/authMiddleware');

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const validation = LeaveTypeValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ error: error.details[0].message })
        } else {
            const addLeaveType = await LeaveType.create(req.body);
            res.send({ message: `${addLeaveType.LeaveName} has been added!` })
        }
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
});

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const leaveTypes = await LeaveType.find().exec();
        res.send(leaveTypes)
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})

module.exports = router;