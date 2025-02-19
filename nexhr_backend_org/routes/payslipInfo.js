const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdmin } = require("../auth/authMiddleware");
const { PaySlip, PaySlipInfo, PayslipInfoSchema } = require("../models/PaySlipInfoModel");
const router = express.Router();

router.get("/", verifyAdminHREmployeeManagerNetwork, async (req, res) => {
    try {
        // const { orgName } = jwt.decode(req.headers['authorization']);
        // const PaySlipInfo = getPayslipInfoModel(orgName)
        const payslipData = await PaySlipInfo.findOne().exec();
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
        const data = await PaySlipInfo.create(req.body);
        res.send({ message: "Payslip has been added", payslipData: data });
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
})

router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const updating = await PaySlipInfo.findByIdAndUpdate(req.params.id, req.body);
        res.send({ message: "Payslip info has been updated" })
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})

// module.exports = { getPayslipInfoModel }
module.exports = router;