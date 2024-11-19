const mongoose = require("mongoose");
const Joi = require("joi");

const PayslipInfoSchema = new mongoose.Schema({
  payslipFields: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { minimize: false })

const PaySlipInfo = mongoose.model("payslipInfo", PayslipInfoSchema);

module.exports = { PaySlipInfo, PayslipInfoSchema }
