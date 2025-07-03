const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require("../auth/authMiddleware");
const { PaySlipInfo } = require("../models/PaySlipInfoModel");
const { errorCollector } = require("../Reuseable_functions/reusableFunction");
const router = express.Router();

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        const payslipData = await PaySlipInfo.findOne().exec();
        if (!payslipData) {
            return res.status(204).send({ message: "No Payslip data in DB" });
        } else {
            res.send(payslipData);
        }
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: err.message })
    }

})

router.post("/", verifyAdminHR, async (req, res) => {
    try {
        const data = await PaySlipInfo.create(req.body);
        res.send({ message: "Payslip has been added", payslipData: data });
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: err.name, message: err.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: err.message })
    }
})

router.put("/:id", verifyAdminHR, async (req, res) => {
    try {
        const updating = await PaySlipInfo.findByIdAndUpdate(req.params.id, req.body);
        res.send({ message: "Payslip info has been updated" })
    } catch (error) {
        await errorCollector({ url: req.originalUrl, name: error.name, message: error.message, env: process.env.ENVIRONMENT })
        res.status(500).send({ error: error.message })
    }
})

module.exports = router;