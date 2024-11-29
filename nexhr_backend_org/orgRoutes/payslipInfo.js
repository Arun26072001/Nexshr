const express = require("express");
const { verifyAdminHREmployee, verifyAdmin } = require("../auth/authMiddleware");
const { Org } = require("../OrgModels/OrganizationModel");
const { getPayslipInfoModel } = require("../OrgModels/OrgPayslipInfo");
const router = express.Router();

router.get("/:orgId", verifyAdminHREmployee, async (req, res) => {
    try {
        const { orgName } = await Org.findById({ _id: req.params.orgId });
        const PaySlipInfo = getPayslipInfoModel(orgName)
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

router.post("/:orgId", verifyAdmin, async (req, res) => {
    try {
        const payslip = { payslipFields: req.body };
        const { orgName } = await Org.findById({ _id: req.params.orgId });
        const PaySlipInfo = getPayslipInfoModel(orgName)
        const data = await PaySlipInfo.create(payslip);
        res.send({ message: "Payslip has been added", payslipData: data });
    } catch (err) {
        res.status(500).send({ message: "Internal server error", details: err.message })
    }
})

// module.exports = { getPayslipInfoModel }
module.exports = router;