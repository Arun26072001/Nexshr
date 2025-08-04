const express = require("express");
const { verifyAdminHREmployeeManagerNetwork, verifyAdminHR } = require("../auth/authMiddleware");
const { PaySlipInfo } = require("../models/PaySlipInfoModel");
const { errorCollector, checkValidObjId } = require("../Reuseable_functions/reusableFunction");
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
  const id = req.params.id;

  if (!checkValidObjId(id)) {
    return res.status(400).send({ message: "Invalid payslip info ID format" });
  }

  try {
    const updated = await PaySlipInfo.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).send({ message: "Payslip info not found" });
    }

    res.send({ message: "Payslip info has been updated", data: updated });
  } catch (error) {
    await errorCollector({
      url: req.originalUrl,
      name: error.name,
      message: error.message,
      env: process.env.ENVIRONMENT
    });
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;