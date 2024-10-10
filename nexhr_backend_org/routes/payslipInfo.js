const express = require("express");
const { verifyAdminHREmployee, verifyAdmin } = require("../auth/authMiddleware");
const { PaySlip, PaySlipInfo } = require("../models/PaySlipInfoModel");
const router = express.Router();

router.get("/", verifyAdminHREmployee, async (req, res) => {
    try {
        const payslipData = await PaySlipInfo.find().exec();
        if (!payslipData) {
            res.status(204).send({ message: "No Payslip data in DB" });
        } else {
            res.send(payslipData);
        }
    } catch (err) {
        res.status(500).send({ message: "internal server error", details: err.message })
    }

})

router.post("/", verifyAdmin, async (req, res) => {
    try {
        // const validation = PaySlipValidation.validate(req.body);
        // const { error } = validation;
        // if (error) {
        //     res.status(400).send({ message: "Validation Error", details: error.details })
        // } else {
        const payslip = {payslipFields: req.body};
        const data = await PaySlipInfo.create(payslip);
        res.send({ message: "Payslip has been added" });
        // }
    } catch (err) {
        res.status(500).send({ message: "Internal server error", details: err.message })
    }
})

module.exports = router;