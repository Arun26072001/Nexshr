const express = require("express");
const { verifyHR, verifyHREmployee, verifyAdminHREmployee } = require("../auth/authMiddleware");
const Joi = require("joi");
const { PaySlipValidation, PaySlip } = require("../models/PaySlipModel");
const router = express.Router();

router.get("/", verifyAdminHREmployee, async (req, res) => {
    try {
        const payslipData = await PaySlip.find().exec();
        if (!payslipData) {
            res.status(204).send({ message: "No Payslip data in DB" });
        } else {
            res.send(payslipData);
        }
    } catch (err) {
        res.status(500).send({message: "internal server error", details: err.message})
    }

})

router.post("/", verifyHR, async (req, res) => {
    try {
        const validation = PaySlipValidation.validate(req.body);
        const { error } = validation;
        if (error) {
            res.status(400).send({ message: "Validation Error", details: error.details })
        } else {
            const data = await PaySlip.create(req.body);
            res.send({ message: "Payslip has been added" })
        }
    } catch (err) {
        res.status(500).send({ message: "Internal server error", details: err.message })
    }
})

module.exports = router;