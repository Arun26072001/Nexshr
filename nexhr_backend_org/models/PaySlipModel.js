
const mongoose = require("mongoose");

const PayslipSchema = mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  payslip: {
    type: mongoose.Schema.Types.Mixed, default: {}
  }
}, { minimize: false })

const Payslip = mongoose.model('payslip', PayslipSchema);

module.exports = { Payslip }