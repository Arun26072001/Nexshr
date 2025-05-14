const express = require('express');
const router = express.Router();
const { LeaveType, LeaveTypeValidation } = require('../models/LeaveTypeModel');
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require('../auth/authMiddleware');

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        if(await LeaveType.exists({LeaveName: req.body.LeaveName})){
            return res.status(400).send({error: `${req.body.LeaveName} is already exists`})
        }
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

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        const { error } = LeaveTypeValidation.validate(req.body);
        if (error) {
            return res.status(400).send({ error: error.details[0].message })
        }
        const updateLeaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true })
        return res.status(200).send({ message: `${updateLeaveType.LeaveName} has been updated successfully`, updateLeaveType })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.delete("/:id", verifyAdminHR, async (req, res) => {
    try {
        const deleteLeaveType = await LeaveType.findByIdAndDelete(req.params.id);
        return res.send({ message: `Leave type has been deleted successfully` })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

module.exports = router;